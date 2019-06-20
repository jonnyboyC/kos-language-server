import {
  IConnection,
  TextDocument,
  TextEdit,
  Diagnostic,
  Location,
  DiagnosticSeverity,
} from 'vscode-languageserver';
import { empty } from '../utilities/typeGuards';
import { PathResolver } from '../utilities/pathResolver';
import { URI } from 'vscode-uri';
import { extname } from 'path';
import { createDiagnostic } from '../utilities/diagnosticsUtils';

interface Document {
  uri: string;
  text: string;
}

type DocumentChangeHandler = (document: Document) => void;
type DocumentClosedHandler = (uri: string) => void;

export type DocumentConnection = Pick<
  IConnection,
  'onDidChangeTextDocument' | 'onDidCloseTextDocument' | 'onDidOpenTextDocument'
>;

export type UriLoader = (uri: string) => Promise<string>;

/**
 * Service responsible for managing documents being loaded by the client and the server
 */
export class DocumentService {
  /**
   * Currently cached documents loaded by the client
   */
  private editorDocs: Map<string, TextDocument>;

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
   * A function to load a uri asynchronously
   */
  private uriLoader: UriLoader;

  /**
   * The path resolver to identifying file paths from kos run paths
   */
  private pathResolver: PathResolver;

  /**
   * Create a new instance of the document service.
   * @param conn document connection holding the required callbacks from iconnection
   * @param logger logger to log messages to client
   */
  constructor(conn: DocumentConnection, uriLoader: UriLoader, logger: ILogger) {
    this.editorDocs = new Map();
    this.serverDocs = new Map();
    this.pathResolver = new PathResolver();
    this.conn = conn;
    this.uriLoader = uriLoader;
    this.logger = logger;
  }

  /**
   * Get a document from this document service
   * @param uri uri to lookup document
   */
  public getDocument(uri: string): Maybe<TextDocument> {
    return this.editorDocs.get(uri) || this.serverDocs.get(uri);
  }

  /**
   * Get all document held in this service
   */
  public getAllDocuments(): TextDocument[] {
    return [...this.editorDocs.values(), ...this.serverDocs.values()];
  }

  public async loadDocument(
    caller: Location,
    kosPath: string,
  ): Promise<Maybe<Diagnostic | TextDocument>> {
    // resolver must first be ready
    if (!this.pathResolver.ready) {
      return undefined;
    }

    // resolve kos path to uri
    const result = this.pathResolver.resolveUri(caller, kosPath);
    if (empty(result)) {
      return result;
    }

    // check for cached versions first
    const cached = this.serverDocs.get(result.uri.toString());
    if (!empty(cached)) {
      return cached;
    }

    try {
      // attempt to load a resource from whatever uri is provided
      const retrieved = await this.retrieveResource(result.uri);
      const textDocument = TextDocument.create(result.uri.toString(), 'temp', 0, retrieved);

      // if found set in cache and return document
      this.serverDocs.set(result.uri.toString(), textDocument);
      return textDocument;

    } catch (err) {

      // create a diagnostic if we can't load the file
      return createDiagnostic(
        caller.range,
        `Unable to load script at ${kosPath}`,
        DiagnosticSeverity.Information,
      );
    }
  }

  /**
   * Called when a document is changed. In this is also called when the editor opens a document
   * in order to synchronize
   * @param handler document change handler
   */
  public onChange(handler: DocumentChangeHandler): void {
    this.onChangeHandler(handler);
    this.onOpenHandler(handler);
  }

  /**
   * Retrieve a resource from the provided uri
   * @param uri uri to load resources from
   */
  private retrieveResource(uri: URI): Promise<string> {
    const ext = extname(uri.fsPath);
    const uriString = uri.toString();

    switch (ext) {
      case '.ks':
        return this.uriLoader(uriString);
      case '.ksm':
        return this.uriLoader(uriString.replace('.ksm', '.ks'));
      case '':
        return this.uriLoader(`${uriString}.ks`);
      default:
        return Promise.reject();
    }
  }

  /**
   * Called when the editor closes a document.
   * @param handler document close handler
   */
  public onClose(handler: DocumentClosedHandler): void {
    this.onCloseHandler(handler);
  }

  /**
   * Handle calls to open text document.
   * @param handler handler to call when did open text document events fires
   */
  private onOpenHandler(handler: DocumentChangeHandler): void {
    this.conn.onDidOpenTextDocument(params => {
      const document = params.textDocument;

      this.editorDocs.delete(document.uri);
      this.editorDocs.set(
        document.uri,
        TextDocument.create(
          document.uri,
          document.languageId,
          document.version,
          document.text,
        ),
      );

      handler(document);
    });
  }

  /**
   * Handle calls to on change text document
   * @param handler handler to call when did change text document event fires
   */
  private onChangeHandler(handler: DocumentChangeHandler): void {
    this.conn.onDidChangeTextDocument(params => {
      // lookup existing document
      const document = this.editorDocs.get(params.textDocument.uri);
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
      this.editorDocs.set(document.uri, updatedDoc);

      // call handler
      handler({ text, uri: document.uri });
    });
  }

  /**
   * On document close handler. Move document from editor docs to server docs.
   * This call notifies any provided handler
   * @param handler document closed handler
   */
  private onCloseHandler(handler: DocumentClosedHandler): void {
    this.conn.onDidCloseTextDocument(params => {
      const { uri } = params.textDocument;

      // get the current document and remove
      const document = this.editorDocs.get(uri);
      this.editorDocs.delete(uri);

      // if document not empty add to server docs
      if (!empty(document)) {
        this.serverDocs.set(uri, document);
      }

      // handle document closing
      handler(uri);
    });
  }
}
