import {
  IConnection,
  TextDocument,
  TextEdit,
  DidChangeTextDocumentParams,
  DidOpenTextDocumentParams,
  DidCloseTextDocumentParams,
} from 'vscode-languageserver';
import { empty } from '../utilities/typeGuards';
import { URI } from 'vscode-uri';
import { IoService, Document } from './IoService';
import { logException, mockTracer } from '../models/logger';
import { normalizeExtensions } from '../utilities/pathUtils';
import { EventEmitter } from 'events';

type DocumentChangeHandler = (document: Document) => void;
type DocumentClosedHandler = (uri: string) => void;

type DocumentConnection = Pick<
  IConnection,
  'onDidChangeTextDocument' | 'onDidCloseTextDocument' | 'onDidOpenTextDocument'
>;

export declare interface DocumentService {
  on(event: 'change', listener: DocumentChangeHandler): this;
  emit(event: 'change', ...args: Parameters<DocumentChangeHandler>): boolean;
  on(event: 'close', listener: DocumentClosedHandler): this;
  emit(event: 'close', ...args: Parameters<DocumentClosedHandler>): boolean;
}

/**
 * Service responsible for managing documents being loaded by the client and the server
 */
export class DocumentService extends EventEmitter {
  /**
   * What is the root volume of this directory
   */
  public rootVolume?: URI;

  /**
   * Currently cached documents loaded by the client
   */
  private clientDocs: Map<string, TextDocument>;

  /**
   * Current cached document only loaded by the server
   */
  private serverDocs: Map<string, TextDocument>;

  /**
   * client connection with events for open, close, and change events
   */
  private conn: DocumentConnection;

  /**
   * A logger to log information to
   */
  private logger: ILogger;

  /**
   * A tracer to location exception
   */
  private tracer: ITracer;

  /**
   * A service for interacting with io
   */
  private ioService: IoService;

  /**
   * Create a new instance of the document service.
   * @param conn document connection holding the required callbacks from iconnection
   * @param ioService service to load from a provided uri
   * @param resolverService service to resolve uri for kerboscript
   * @param logger logger to log messages to client
   * @param tracer tracer to location exception
   */
  constructor(
    conn: DocumentConnection,
    ioService: IoService,
    logger: ILogger,
    tracer: ITracer,
    rootVolume?: URI,
  ) {
    super();
    this.clientDocs = new Map();
    this.serverDocs = new Map();
    this.conn = conn;
    this.ioService = ioService;
    this.logger = logger;
    this.tracer = tracer;
    this.rootVolume = rootVolume;

    this.conn.onDidChangeTextDocument(this.onChangeHandler.bind(this));
    this.conn.onDidOpenTextDocument(this.onOpenHandler.bind(this));
    this.conn.onDidCloseTextDocument(this.onCloseHandler.bind(this));
  }

  /**
   * Is the document service read
   */
  public ready(): boolean {
    return !empty(this.rootVolume);
  }

  /**
   * Get a document from this document service
   * @param uri uri to lookup document
   */
  public getDocument(uri: string): Maybe<TextDocument> {
    const normalized = normalizeExtensions(uri);

    if (empty(normalized)) {
      return undefined;
    }
    return this.clientDocs.get(normalized) || this.serverDocs.get(normalized);
  }

  /**
   * Get all document held in this service
   */
  public getAllDocuments(): TextDocument[] {
    return [...this.clientDocs.values(), ...this.serverDocs.values()];
  }

  /**
   * Attempt to load a document from a provided uri
   * @param uri the requested uri
   */
  public async loadDocument(uri: string): Promise<Maybe<TextDocument>> {
    // resolver must first be ready
    if (!this.ready()) {
      return undefined;
    }

    // attempt to load a resource from whatever uri is provided
    const normalized = normalizeExtensions(uri);
    if (empty(normalized)) {
      return undefined;
    }

    // check for cached versions first
    const cached = this.serverDocs.get(normalized);
    if (!empty(cached)) {
      return cached;
    }

    try {
      // attempt to load a resource from whatever uri is provided
      const uri = URI.parse(normalized);
      const retrieved = await this.retrieveResource(uri);
      const textDocument = TextDocument.create(normalized, 'kos', 0, retrieved);

      // if found set in cache and return document
      this.serverDocs.set(normalized, textDocument);
      return textDocument;
    } catch (err) {
      logException(this.logger, this.tracer, err, LogLevel.error);

      return undefined;
    }
  }

  /**
   * Cache all documents in the workspace.
   */
  public async cacheDocuments() {
    if (empty(this.rootVolume)) {
      return;
    }

    try {
      for await (const { uri, text } of this.ioService.loadDirectory(
        this.rootVolume.fsPath,
      )) {
        const textDocument = TextDocument.create(uri, 'kos', 0, text);
        if (!this.clientDocs.has(uri)) {
          this.serverDocs.set(uri, textDocument);
        }
      }
    } catch (err) {
      logException(this.logger, mockTracer, err, LogLevel.error);
    }
  }

  /**
   * Retrieve a resource from the provided uri
   * @param uri uri to load resources from
   */
  private retrieveResource(uri: URI): Promise<string> {
    const path = uri.fsPath;
    return this.ioService.load(path);
  }

  /**
   * Handle calls to open text document.
   * @param handler handler to call when did open text document events fires
   */
  private onOpenHandler(params: DidOpenTextDocumentParams): void {
    const document = params.textDocument;

    this.clientDocs.delete(document.uri);
    this.clientDocs.set(
      document.uri,
      TextDocument.create(
        document.uri,
        document.languageId,
        document.version,
        document.text,
      ),
    );

    this.emit('change', document);
  }

  /**
   * Handle calls to on change text document
   * @param handler handler to call when did change text document event fires
   */
  private onChangeHandler(params: DidChangeTextDocumentParams): void {
    // lookup existing document
    const document = this.clientDocs.get(params.textDocument.uri);
    if (empty(document)) {
      return;
    }

    // find all edits that have defined range
    const edits: Required<TextEdit>[] = [];
    for (const change of params.contentChanges) {
      // TODO can't find instance where range is undefined
      if (empty(change.range)) {
        this.logger.error(
          'Document context change had undefined range for this change',
        );
        this.logger.error(JSON.stringify(change));
        continue;
      }

      edits.push({ range: change.range, newText: change.text });
    }

    // apply edits
    const text = TextDocument.applyEdits(document, edits);

    // create new document
    const updatedDoc = TextDocument.create(
      document.uri,
      document.languageId,
      document.version,
      text,
    );

    // update editor docs
    this.clientDocs.set(document.uri, updatedDoc);
    this.serverDocs.delete(document.uri);

    // call handler
    this.emit('change', { text, uri: document.uri });
  }

  /**
   * On document close handler. Move document from editor docs to server docs.
   * This call notifies any provided handler
   * @param handler document closed handler
   */
  private onCloseHandler(params: DidCloseTextDocumentParams): void {
    const { uri } = params.textDocument;

    // get the current document and remove
    const document = this.clientDocs.get(uri);
    this.clientDocs.delete(uri);

    // if document not empty add to server docs
    if (!empty(document)) {
      this.serverDocs.set(uri, document);
    }

    // handle document closing
    this.emit('close', uri);
  }
}
