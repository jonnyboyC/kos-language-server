import { EventEmitter } from 'events';
import { DocumentService } from './documentService';
import { AnalysisService } from './analysisService';
import {
  DocumentSymbolParams,
  CancellationToken,
  SymbolInformation,
  WorkspaceSymbolParams,
  TextDocumentPositionParams,
  Location,
  Position,
  Range,
  ReferenceParams,
  RenameParams,
  WorkspaceEdit,
  TextEdit,
  IConnection,
  Hover,
  DocumentHighlight,
} from 'vscode-languageserver';
import { KsBaseSymbol, KsSymbolKind } from '../analysis/types';
import { SymbolTable } from '../analysis/models/symbolTable';
import { toLangServerSymbols } from '../utilities/serverUtils';
import { notEmpty, empty } from '../utilities/typeGuards';
import { flatten } from '../utilities/arrayUtils';
import { levenshteinDistance } from '../utilities/levenshtein';
import { ScriptFind, AstContext } from '../parser/scriptFind';
import { runPath } from '../utilities/pathUtils';
import { builtIn } from '../utilities/constants';
import * as Stmt from '../parser/models/stmt';
import { cleanLocation, cleanPosition, cleanRange } from '../utilities/clean';
import { ResolverService } from './resolverService';
import { IoService } from './ioService';
import { Scanner } from '../scanner/scanner';
import { isValidIdentifier } from '../models/tokentypes';
import { tokenTrackedType } from '../typeChecker/utilities/typeUtilities';
import { IFindResult } from '../parser/types';

export type SymbolConnection = Pick<
  IConnection,
  | 'onRenameRequest'
  | 'onReferences'
  | 'onDocumentSymbol'
  | 'onWorkspaceSymbol'
  | 'onDefinition'
  | 'onHover'
  | 'onDocumentHighlight'
>;

export class SymbolService extends EventEmitter {
  /**
   * client connection with events for open, close, and change events
   */
  private conn: SymbolConnection;

  /**
   * A service to resolve path in kos
   */
  private readonly resolverService: ResolverService;

  /**
   * A service for interacting with io
   */
  private readonly ioService: IoService;

  /**
   * The document service to store and manage documents
   */
  private readonly documentService: DocumentService;

  /**
   * A service to provide analysis against scripts
   */
  private readonly analysisService: AnalysisService;

  /**
   * Construct a new completion service
   * @param conn Symbol connection holding hte required callbacks from iconnection
   * @param resolverService A service for resolving paths
   * @param ioService A service for interacting with io
   * @param documentService The document service to load new files from disk
   * @param analysisService The analysis service for retrieving semantic document info
   */
  constructor(
    conn: SymbolConnection,
    resolverService: ResolverService,
    ioService: IoService,
    documentService: DocumentService,
    analysisService: AnalysisService,
  ) {
    super();
    this.conn = conn;
    this.resolverService = resolverService;
    this.ioService = ioService;
    this.documentService = documentService;
    this.analysisService = analysisService;
  }

  /**
   * Attach to listener to connection events
   */
  public listen(): void {
    this.conn.onRenameRequest(this.onRenameRequest.bind(this));
    this.conn.onReferences(this.onReferences.bind(this));
    this.conn.onDocumentSymbol(this.onDocumentSymbol.bind(this));
    this.conn.onWorkspaceSymbol(this.onWorkspaceSymbol.bind(this));
    this.conn.onDefinition(this.onDefinition.bind(this));
    this.conn.onHover(this.onHover.bind(this));
    this.conn.onDocumentHighlight(this.onDocumentHighlight.bind(this));
  }

  /**
   * This handler provides document symbol capabilities. This provides a list of all
   * symbols that are located within a given document
   * @param documentSymbol the document to provide symbols for
   * @param cancellation request cancellation token
   */
  public async onDocumentSymbol(
    documentSymbol: DocumentSymbolParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<SymbolInformation[]>> {
    const { uri } = documentSymbol.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const entities = await this.loadAllTableSymbols(uri);
    return toLangServerSymbols(entities);
  }

  /**
   * This handler provides workspace symbol capabilities
   * @param workspaceSymbol workspace symbol params
   * @param cancellation cancellation token
   */
  public onWorkspaceSymbol(
    workspaceSymbol: WorkspaceSymbolParams,
    cancellation: CancellationToken,
  ): Maybe<SymbolInformation[]> {
    const query = workspaceSymbol.query.toLowerCase();

    // exit if cancel requested
    if (cancellation.isCancellationRequested || query.length < 2) {
      return undefined;
    }

    // retrieve all loaded symbols tables
    const symbolTables = this.documentService
      .getAllDocuments()
      .map(doc => this.getSymbolTable(doc.uri))
      .filter(notEmpty);

    // get all symbols
    const symbols = flatten(symbolTables.map(table => table.allSymbols()));
    const includeSymbols = symbols.filter(symbol =>
      symbol.name.lookup.includes(query),
    );

    // determine levenshtein distance to query
    let symbolDistance: [KsBaseSymbol, number][] = symbols.map(symbol => [
      symbol,
      levenshteinDistance(
        query,
        symbol.name.lexeme.substr(0, query.length + 2),
      ),
    ]);

    symbolDistance = symbolDistance.sort(
      ([, dist1], [, dist2]) => dist1 - dist2,
    );

    const end = symbolDistance.findIndex(([, dist]) => dist > 3);
    const topSymbols = symbolDistance
      .slice(0, end !== -1 ? Math.min(end, 100) : 50)
      .map(([symbol]) => symbol);

    // get includes then top levenshtein distance symbols
    const langSymbols =
      toLangServerSymbols([...new Set([...includeSymbols, ...topSymbols])]) ??
      [];

    return langSymbols.filter(symbol => symbol.name.length > query.length - 1);
  }

  /**
   * This handler provides go to definition capabilities. When a client requests a symbol
   * go to definition this provides the location if it exists
   * @param positionParams the position of the definition request
   * @param cancellation request cancellation token
   */
  public async onDefinition(
    positionParams: TextDocumentPositionParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<Location>> {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const location = await this.getDeclarationLocation(position, uri);
    return location && cleanLocation(location);
  }

  /**
   * This handler provides reference capabilities to symbols in a document. This allows a client
   * to identify all positions that a symbol is used in the document or attached documents
   * @param reference parameters describing the reference request
   * @param cancellation request cancellation token
   */
  public async onReferences(
    reference: ReferenceParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<Location[]>> {
    const { position } = reference;
    const { uri } = reference.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const locations = await this.getSymbolLocations(position, uri);
    return locations && locations.map(loc => cleanLocation(loc));
  }

  /**
   * This handler provider rename capabilities. This allows a client to highlight
   * as symbol and provide a new name that will change for all known symbols
   * @param rename information describing what and where a rename should occur
   * @param cancellation request cancellation token
   */
  public async onRenameRequest(
    rename: RenameParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<WorkspaceEdit>> {
    const { newName, position, textDocument } = rename;
    const scanner = new Scanner(newName);

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const { tokens, diagnostics: scanErrors } = scanner.scanTokens();

    // check if rename is valid
    if (
      scanErrors.length > 0 ||
      tokens.length !== 1 ||
      !isValidIdentifier(tokens[0].type)
    ) {
      return undefined;
    }

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const locations = await this.getSymbolLocations(position, textDocument.uri);
    if (empty(locations)) {
      return undefined;
    }
    const changes: PropType<WorkspaceEdit, 'changes'> = {};

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    for (const location of locations) {
      if (!changes.hasOwnProperty(location.uri)) {
        changes[location.uri] = [];
      }

      changes[location.uri].push(TextEdit.replace(location.range, newName));
    }

    return { changes };
  }

  /**
   * This handler provides on hover capability for symbols in a document. This allows additional
   * information to be displayed to the user about symbols throughout the document
   * @param positionParams the position of the hover request
   * @param cancellation request cancellation token
   */
  public async onHover(
    positionParams: TextDocumentPositionParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<Hover>> {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const result = await this.findToken(position, uri);

    if (empty(result)) {
      return undefined;
    }

    const { token } = result;
    const type = tokenTrackedType(token);

    const { tracker } = token;
    let label: string;
    let symbolKind: string;

    if (!empty(tracker)) {
      symbolKind = KsSymbolKind[tracker.declared.symbol.tag];

      const { name } = tracker.declared.symbol;
      label = typeof name === 'string' ? name : name.lexeme;
    } else {
      symbolKind = 'literal';
      label = token.lexeme;
    }

    return (
      type && {
        contents: {
          // Note doesn't does do much other than format it as code
          // may look into adding type def syntax highlighting
          language: 'kos',
          value: `(${symbolKind}) ${label}: ${type.toString()} `,
        },
        range: {
          start: cleanPosition(token.start),
          end: cleanPosition(token.end),
        },
      }
    );
  }

  /**
   * This handler provides highlight within a requested document. This allows the client
   * to highlight and symbol and other instances of that symbol to also highlight.
   * @param positionParams the position of the highlight request
   * @param cancellation request cancellation token
   */
  public async onDocumentHighlight(
    positionParams: TextDocumentPositionParams,
    cancellation: CancellationToken,
  ): Promise<DocumentHighlight[]> {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return [];
    }

    const locations = await this.getSymbolLocations(position, uri);
    return locations?.map(({ range }) => ({ range: cleanRange(range) })) ?? [];
  }

  /**
   * Get all usage locations in all files
   * @param pos position in document
   * @param uri uri of document
   */
  private async getSymbolLocations(
    pos: Position,
    uri: string,
  ): Promise<Maybe<Location[]>> {
    const result = await this.findToken(pos, uri);
    const table = await this.loadSymbolTable(uri);

    if (empty(result) || empty(table)) {
      return undefined;
    }

    // try to find the tracker at a given position
    const { token } = result;
    const tracker = table.scopedNamedTracker(pos, token.lookup);
    if (empty(tracker)) {
      return undefined;
    }

    return [tracker.declared, ...tracker.usages, ...tracker.sets].filter(
      location => location.uri !== builtIn,
    );
  }

  /**
   * Get the declaration location for the token at the provided position
   * @param pos position in the document
   * @param uri uri of the document
   */
  private async getDeclarationLocation(
    pos: Position,
    uri: string,
  ): Promise<Maybe<Location>> {
    const result = await this.findToken(
      pos,
      uri,
      Stmt.Run,
      Stmt.RunPath,
      Stmt.RunOncePath,
    );

    if (empty(result)) {
      return undefined;
    }

    // check if symbols has tracker
    const { token, node } = result;
    if (notEmpty(token.tracker)) {
      const { declared } = token.tracker;

      // exit if undefined
      if (declared.uri === builtIn) {
        return undefined;
      }

      return typeof declared.symbol.name !== 'string'
        ? declared.symbol.name
        : undefined;
    }

    // if no tracker it might be a run statement
    if (
      node instanceof Stmt.Run ||
      node instanceof Stmt.RunPath ||
      node instanceof Stmt.RunOncePath
    ) {
      return this.getRunLocation(node, uri);
    }

    return undefined;
  }

  /**
   * Get the location of a run statement
   * @param run run statement
   * @param uri run statment uri
   */
  private getRunLocation(
    run: Stmt.Run | Stmt.RunPath | Stmt.RunOncePath,
    uri: string,
  ) {
    // get the kos run path
    const kosPath = runPath(run);
    if (typeof kosPath !== 'string') {
      return undefined;
    }

    const resolved = this.resolverService.resolve(run.toLocation(uri), kosPath);

    if (empty(resolved)) {
      return undefined;
    }

    // resolve to the file system
    const found = this.ioService.exists(resolved);
    return (
      found &&
      Location.create(
        found.toString(),
        Range.create(Position.create(0, 0), Position.create(0, 0)),
      )
    );
  }

  /**
   * Get the token at the provided position in the text document
   * @param pos position in the text document
   * @param uri uri of the text document
   */
  public async findToken(
    pos: Position,
    uri: string,
    ...contexts: AstContext[]
  ): Promise<Maybe<IFindResult>> {
    const documentInfo = await this.analysisService.loadInfo(uri);
    if (empty(documentInfo)) {
      return undefined;
    }

    // try to find an symbol at the position
    const { script } = documentInfo.lexicalInfo;
    const finder = new ScriptFind();
    return finder.find(script, pos, ...contexts);
  }

  /**
   * Get or load a symbol table if it exists
   * @param uri document uri to load
   */
  private async loadSymbolTable(uri: string): Promise<Maybe<SymbolTable>> {
    return (await this.analysisService.loadInfo(uri))?.semanticInfo.symbolTable;
  }

  /**
   * Get a symbol table if it has already been loaded
   * @param uri document uri to get
   */
  private getSymbolTable(uri: string): Maybe<SymbolTable> {
    return this.analysisService.getInfo(uri)?.semanticInfo.symbolTable;
  }

  /**
   * load all symbols in a provided file
   * @param uri document uri
   */
  private async loadAllTableSymbols(uri: string): Promise<KsBaseSymbol[]> {
    return (await this.loadSymbolTable(uri))?.allSymbols() ?? [];
  }
}
