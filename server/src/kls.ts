import {
  DiagnosticSeverity,
  Position,
  Location,
  Diagnostic,
  Range,
  Connection,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  InitializedParams,
  DidChangeConfigurationNotification,
  DidChangeConfigurationParams,
  CompletionParams,
  CompletionItem,
  TextDocumentPositionParams,
  RenameParams,
  WorkspaceEdit,
  TextEdit,
  DocumentHighlight,
} from 'vscode-languageserver';
import {
  IDocumentInfo,
  ILoadData,
  IDiagnosticUri,
  ValidateResult,
  KLSConfiguration,
  ClientConfiguration,
} from './types';
import { performance, PerformanceObserver } from 'perf_hooks';
import { Parser } from './parser/parser';
import { PreResolver } from './analysis/preResolver';
import { Scanner } from './scanner/scanner';
import { Resolver } from './analysis/resolver';
import { IParseError, ScriptResult, RunStmtType } from './parser/types';
import { KsSymbol, KsSymbolKind, SymbolTracker, KsBaseSymbol, TrackerKind } from './analysis/types';
import { mockLogger, mockTracer, logException } from './utilities/logger';
import { empty, notEmpty } from './utilities/typeGuards';
import { ScriptFind } from './parser/scriptFind';
import * as Expr from './parser/expr';
import * as Stmt from './parser/stmt';
import * as SuffixTerm from './parser/suffixTerm';
import { PathResolver, runPath } from './utilities/pathResolver';
import { existsSync } from 'fs';
import { extname } from 'path';
import { readFileAsync, retrieveUriAsync } from './utilities/fsUtils';
import {
  standardLibraryBuilder,
  bodyLibraryBuilder,
} from './analysis/standardLibrary';
import { builtIn, serverName, keywordCompletions } from './utilities/constants';
import { SymbolTableBuilder } from './analysis/symbolTableBuilder';
import { SymbolTable } from './analysis/symbolTable';
import { TypeChecker } from './typeChecker/typeChecker';
import { Token } from './entities/token';
import { binarySearchIndex } from './utilities/positionUtils';
import { URI } from 'vscode-uri';
import { DocumentService, Document } from './services/documentService';
import {
  defaultClientConfiguration,
  caseMapper,
  logMapper,
  suffixCompletionItems,
  symbolCompletionItems,
} from './utilities/serverUtils';
import { cleanDiagnostic, cleanRange, cleanPosition } from './utilities/clean';
import { isValidIdentifier } from './entities/tokentypes';
import { tokenTrackedType } from './typeChecker/typeUitlities';

export class KLS {
  /**
   * What is the workspace uri
   */
  public workspaceUri?: string;

  /**
   * The current loaded standard library
   */
  private standardLibrary: SymbolTable;

  /**
   * The current loaded celetrial body library
   */
  private bodyLibrary: SymbolTable;

  /**
   * The logger used by this and all dependencies
   */
  private readonly logger: ILogger;

  /**
   * The tracer used by this and all dependencies
   */
  private readonly tracer: ITracer;

  /**
   * A path resolve for converting kos run paths into uris
   */
  private readonly pathResolver: PathResolver;

  /**
   * Document information
   */
  private readonly documentInfos: Map<string, IDocumentInfo>;

  /**
   * Performance observer for tracking analysis speed
   */
  private readonly observer: PerformanceObserver;

  /**
   * Connection to the client
   */
  private readonly connection: Connection;

  /**
   * This server's configuration
   */
  private readonly configuration: KLSConfiguration;

  /**
   * The document server to store and manage documents
   */
  private readonly documentService: DocumentService;

  constructor(
    caseKind: CaseKind = CaseKind.camelcase,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
    connection: Connection,
    configuration: KLSConfiguration,
  ) {
    this.workspaceUri = undefined;
    this.pathResolver = new PathResolver();
    this.logger = logger;
    this.tracer = tracer;
    this.documentInfos = new Map();
    this.configuration = configuration;
    this.connection = connection;
    this.documentService = new DocumentService(
      connection,
      retrieveUriAsync,
      logger,
    );

    this.standardLibrary = standardLibraryBuilder(caseKind);
    this.bodyLibrary = bodyLibraryBuilder(caseKind);

    this.observer = new PerformanceObserver(list => {
      this.logger.info('');
      this.logger.info('-------- Performance ---------');
      for (const entry of list.getEntries()) {
        this.logger.info(`${entry.name} took ${entry.duration} ms`);
      }
      this.logger.info('------------------------------');
    });
    this.observer.observe({ entryTypes: ['measure'], buffered: true });
    this.initializeConnection();
  }

  private initializeConnection(): void {
    this.connection.onInitialize(this.onInitialize.bind(this));
    this.connection.onInitialized(this.onInitialized.bind(this));
    this.connection.onDidChangeConfiguration(
      this.onDidChangeConfiguration.bind(this),
    );
    this.connection.onCompletion(this.onCompletion.bind(this));
    this.connection.onCompletionResolve(this.onCompletionResolve.bind(this));
    this.connection.onRenameRequest(this.onRenameRequest.bind(this));
    this.connection.onDocumentHighlight(this.onDocumentHighlight.bind(this));
    this.connection.onHover(this.onHover.bind(this));
    // this.connection.onReferences();
    // this.connection.onSignatureHelp();
    // this.connection.onDocumentSymbol();

    this.documentService.onChange(this.onChange.bind(this));
  }

  /**
   * Initialize the server from the client connection
   * @param params initialization parameters
   */
  private onInitialize(params: InitializeParams): InitializeResult {
    const { capabilities, rootPath, rootUri } = params;

    this.connection.console.log(
      `[KLS Server(${process.pid})] Started and initialize received.`,
    );

    // does the client support configurations
    this.configuration.clientCapability.hasConfiguration = !!(
      capabilities.workspace && !!capabilities.workspace.configuration
    );

    // does the client support workspace folders
    this.configuration.clientCapability.hasWorkspaceFolder = !!(
      capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );

    // get root path if it exists
    if (rootPath) {
      this.configuration.workspaceFolder = rootPath;
    }

    // get root uri if it exists
    if (rootUri) {
      this.setUri(rootUri);
      this.configuration.workspaceUri = rootUri;
    }

    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,

        // Tell the client that the server supports code completion
        completionProvider: {
          resolveProvider: true,
          triggerCharacters: [':', '(', ', '],
        },

        // Tell the client that the server support signiture help
        signatureHelpProvider: {
          triggerCharacters: ['(', ',', ', '],
        },

        // indicate other capabilities
        renameProvider: true,
        documentHighlightProvider: true,
        hoverProvider: true,
        referencesProvider: true,
        documentSymbolProvider: true,
        definitionProvider: true,
      },
    };
  }

  /**
   * Post initialization register additional hooks and retrieve client
   * configurations
   * @param _ initialized parameters
   */
  private async onInitialized(_: InitializedParams): Promise<void> {
    const { clientCapability } = this.configuration;

    // register for all configuration changes.
    if (clientCapability.hasConfiguration) {
      this.connection.client.register(DidChangeConfigurationNotification.type, {
        section: serverName,
      });
    }

    // register workspace changes
    if (clientCapability.hasWorkspaceFolder) {
      this.connection.workspace.onDidChangeWorkspaceFolders(_ => {
        // TODO dump all documents
        this.logger.log('Workspace folder change event received.');
      });
    }

    const clientConfig = await this.getDocumentSettings();
    this.configuration.clientConfig = clientConfig;

    const casePreference = caseMapper(clientConfig.completionCase);
    const logPreference = logMapper(clientConfig.trace.server.level);

    this.setCase(casePreference);
    this.logger.level = logPreference;
  }

  /**
   * Update the server configuration when the client signals a change in it's configuration for
   * the kos-language-server
   * @param change The updated settings
   */
  private onDidChangeConfiguration(change: DidChangeConfigurationParams): void {
    const { clientCapability } = this.configuration;

    if (clientCapability.hasConfiguration) {
      if (change.settings && serverName in change.settings) {
        Object.assign(
          this.configuration.clientConfig,
          defaultClientConfiguration,
          change.settings[serverName],
        );
      }

      // update server on client config
      this.updateServer(this.configuration.clientConfig);
    }
  }

  /**
   * Respond to completion requests from the client. This handler currently provides
   * both symbol completion as well as suffix completion.
   * @param completion the parameters describing the completion request
   */
  private onCompletion(completion: CompletionParams): Maybe<CompletionItem[]> {
    const { context } = completion;

    try {
      // check if suffix completion
      if (!empty(context) && !empty(context.triggerCharacter)) {
        const { triggerCharacter } = context;

        if (triggerCharacter === ':') {
          return suffixCompletionItems(this, completion);
        }
      }

      // complete base symbols
      return symbolCompletionItems(
        this,
        completion,
        this.configuration.keywords,
      );

      // catch any errors
    } catch (err) {
      logException(this.logger, this.tracer, err, LogLevel.error);
      return undefined;
    }
  }

  /**
   * This handler provider completion item resolution capability. This provides
   * additional information for the currently completion item selection
   * @param completionItem the item to resolve further
   */
  private onCompletionResolve(completionItem: CompletionItem): CompletionItem {
    try {
      const token = completionItem.data as Maybe<Token>;

      if (!empty(token)) {
      }

      return completionItem;
    } catch (err) {
      logException(this.logger, this.tracer, err, LogLevel.error);
      return completionItem;
    }
  }

  /**
   * This handler provider rename capabilities. This allows a client to highlight
   * as symbol and provide a new name that will change for all known symbols
   * @param rename information describing what and where a rename should occur
   */
  private onRenameRequest(rename: RenameParams): Maybe<WorkspaceEdit> {
    const { newName, position, textDocument } = rename;
    const scanner = new Scanner(newName);
    const { tokens, scanErrors } = scanner.scanTokens();

    // check if rename is valid
    if (
      scanErrors.length > 0 ||
      tokens.length !== 1 ||
      !isValidIdentifier(tokens[0].type)
    ) {
      return undefined;
    }

    const locations = this.getUsageLocations(
      position,
      textDocument.uri,
    );
    if (empty(locations)) {
      return undefined;
    }
    const changes: PropType<WorkspaceEdit, 'changes'> = {};

    for (const location of locations) {
      if (!changes.hasOwnProperty(location.uri)) {
        changes[location.uri] = [];
      }

      changes[location.uri].push(TextEdit.replace(location.range, newName));
    }

    return { changes };
  }

  /**
   * This handler provides highlight within a requested document. This allows the client
   * to highlight and symbol and other instances of that symbol to also highlight.
   * @param positionParams the position of the highlight request
   */
  private onDocumentHighlight(positionParams: TextDocumentPositionParams): DocumentHighlight[] {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    const locations = this.getFileUsageRanges(position, uri);
    return empty(locations)
      ? []
      : locations.map(range => ({ range: cleanRange(range) }));
  }

  /**
   * This handler provides on hover capability for symbols in a document. This allows additional
   * information to be displayed to the user about symbols througout the document
   * @param positionParams the position of the hover request
   */
  private onHover(positionParams: TextDocumentPositionParams) {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    const token = this.getToken(position, uri);

    if (empty(token)) {
      return undefined;
    }

    const type = tokenTrackedType(token);

    const { tracker } = token;
    let label: string;
    let symbolKind: string;

    if (!empty(tracker)) {
      symbolKind = KsSymbolKind[tracker.declared.symbol.tag];

      label =
        tracker.kind === TrackerKind.basic
          ? tracker.declared.symbol.name.lexeme
          : tracker.declared.symbol.name;
    } else {
      symbolKind = 'literal';
      label = token.lexeme;
    }

    if (empty(type)) {
      return undefined;
    }

    return {
      contents: {
        // Note doesn't does do much other than format it as code
        // may look into adding type def syntax highlighting
        language: 'kos',
        value: `(${symbolKind}) ${label}: ${type.toTypeString()} `,
      },
      range: {
        start: cleanPosition(token.start),
        end: cleanPosition(token.end),
      },
    };
  }

  /**
   * Respond to updates made to document by the client. This method
   * will parse and update the internal state of affects scripts
   * reporting errors to the client as they are discovered
   * @param document the updated document
   */
  private async onChange(document: Document) {
    try {
      const diagnosticResults = this.validateDocument(
        document.uri,
        document.text,
      );

      let total = 0;
      const diagnosticMap: Map<string, Diagnostic[]> = new Map();

      // retrieve diagnostics from analyzer
      for await (const diagnostics of diagnosticResults) {
        total += diagnostics.length;

        for (const diagnostic of diagnostics) {
          const uriDiagnostics = diagnosticMap.get(diagnostic.uri);
          if (empty(uriDiagnostics)) {
            diagnosticMap.set(diagnostic.uri, [cleanDiagnostic(diagnostic)]);
          } else {
            uriDiagnostics.push(cleanDiagnostic(diagnostic));
          }
        }
      }

      // send diagnostics to each document reported
      for (const [uri, diagnostics] of diagnosticMap.entries()) {
        this.connection.sendDiagnostics({
          uri,
          diagnostics,
        });
      }

      // if not problems found clear out diagnostics
      if (total === 0) {
        this.connection.sendDiagnostics({
          uri: document.uri,
          diagnostics: [],
        });
      }
    } catch (e) {
      // report any exceptions to the client
      this.connection.console.error('kos-language-server Error occurred:');
      if (e instanceof Error) {
        this.connection.console.error(e.message);

        if (!empty(e.stack)) {
          this.connection.console.error(e.stack);
        }
      } else {
        this.connection.console.error(JSON.stringify(e));
      }
    }
  }

  /**
   * Get document settings from the client. If the client does not support
   * have configurations then return the default configurations.
   */
  private getDocumentSettings(): Thenable<ClientConfiguration> {
    if (!this.configuration.clientCapability.hasConfiguration) {
      return Promise.resolve(defaultClientConfiguration);
    }

    return this.connection.workspace.getConfiguration({
      scopeUri: this.workspaceUri,
      section: serverName,
    });
  }

  /**
   * Update the servers configuration in reponse to a change in the client configuration
   * @param clientConfig client configuration
   */
  private updateServer(clientConfig: ClientConfiguration) {
    this.configuration.clientConfig = clientConfig;

    const casePreference = caseMapper(clientConfig.completionCase);
    const logPreference = logMapper(clientConfig.trace.server.level);

    this.setCase(casePreference);
    this.logger.level = logPreference;
  }

  /**
   * Set the volume 0 path for the analyzer
   * @param uri path of volume 0
   */
  public setUri(uri: string): void {
    this.pathResolver.volume0Uri = URI.parse(uri);
    this.workspaceUri = uri;
  }

  /**
   * Set the case of the body library and standard library
   * @param caseKind case to set
   */
  public setCase(caseKind: CaseKind) {
    this.configuration.keywords = keywordCompletions(caseKind);
    this.standardLibrary = standardLibraryBuilder(caseKind);
    this.bodyLibrary = bodyLibraryBuilder(caseKind);
  }

  /**
   * Validate a document in asynchronous stages. This produces diagnostics about known errors or
   * potential problems in the provided script
   * @param uri uri of the document
   * @param text source text of the document
   * @param depth TODO remove: current depth of the document
   */
  public async *validateDocument(
    uri: string,
    text: string,
    depth: number = 0,
  ): AsyncIterableIterator<IDiagnosticUri[]> {
    for await (const result of this.validateDocument_(uri, text, depth)) {
      if (Array.isArray(result)) {
        yield result;
      }
    }
  }

  /**
   * Get the token at the provided position in the text document
   * @param pos position in the text document
   * @param uri uri of the text document
   */
  public getToken(pos: Position, uri: string): Maybe<Token> {
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)) {
      return undefined;
    }

    // try to find an symbol at the position
    const { script } = documentInfo;
    const finder = new ScriptFind();
    const result = finder.find(script, pos);

    return result && result.token;
  }

  /**
   * Get the declaration location for the token at the provided position
   * @param pos position in the document
   * @param uri uri of the document
   */
  public getDeclarationLocation(pos: Position, uri: string): Maybe<Location> {
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)) {
      return undefined;
    }

    // try to find an symbol at the position
    const { script } = documentInfo;
    const finder = new ScriptFind();
    const result = finder.find(script, pos);

    if (empty(result)) {
      return undefined;
    }

    // check if symbols exists
    const { tracker } = result.token;
    if (empty(tracker)) {
      return undefined;
    }

    const { declared } = tracker;

    // exit if undefined
    if (declared.uri === builtIn) {
      return undefined;
    }

    return typeof declared.symbol.name !== 'string'
      ? declared.symbol.name
      : undefined;
  }

  /**
   * Get all usage locations in all files
   * @param pos position in document
   * @param uri uri of document
   */
  public getUsageLocations(pos: Position, uri: string): Maybe<Location[]> {
    const documentInfo = this.documentInfos.get(uri);
    if (
      empty(documentInfo) ||
      empty(documentInfo.symbolsTable) ||
      empty(documentInfo.script)
    ) {
      return undefined;
    }

    // try to find the symbol at the position
    const { symbolsTable, script } = documentInfo;
    const finder = new ScriptFind();
    const result = finder.find(script, pos);

    if (empty(result)) {
      return undefined;
    }

    // try to find the tracker at a given position
    const { token } = result;
    const tracker = symbolsTable.scopedNamedTracker(pos, token.lookup);
    if (empty(tracker)) {
      return undefined;
    }

    return tracker.usages
      .map(usage => usage as Location)
      .concat(tracker.declared.symbol.name)
      .filter(location => location.uri !== builtIn);
  }

  /**
   * Get all usage ranges in a provide file
   * @param pos position in document
   * @param uri uri of document
   */
  public getFileUsageRanges(pos: Position, uri: string): Maybe<Range[]> {
    const locations = this.getUsageLocations(pos, uri);
    if (empty(locations)) {
      return locations;
    }

    return locations.filter(loc => loc.uri === uri).map(loc => loc.range);
  }

  /**
   * Get all symbols in scope at a particulare location in the file
   * @param pos position in document
   * @param uri document uri
   */
  public getScopedSymbols(pos: Position, uri: string): KsBaseSymbol[] {
    const documentInfo = this.documentInfos.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.symbolsTable)) {
      return documentInfo.symbolsTable.scopedSymbols(pos);
    }

    return [];
  }

  /**
   * Get all symbols in a provided file
   * @param uri document uri
   */
  public getAllFileSymbols(uri: string): KsSymbol[] {
    const documentInfo = this.documentInfos.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.symbolsTable)) {
      return documentInfo.symbolsTable.fileSymbols();
    }

    return [];
  }

  /**
   * Get a function located at the current location
   * @param pos position in the document
   * @param uri document uri
   */
  public getFunctionAtPosition(
    pos: Position,
    uri: string,
  ): Maybe<{ tracker: SymbolTracker; index: number }> {
    // we need the document info to lookup a signature
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)) return undefined;

    const { script } = documentInfo;
    const finder = new ScriptFind();

    // attempt to find a token here get surround invalid Stmt context
    const outerResult = finder.find(script, pos, Expr.Suffix, Stmt.Invalid);
    const innerResult = finder.find(script, pos, SuffixTerm.Call);

    let index = 0;
    if (
      !empty(innerResult) &&
      !empty(innerResult.node) &&
      innerResult.node instanceof SuffixTerm.Call
    ) {
      index =
        innerResult.node.args.length > 0 ? innerResult.node.args.length - 1 : 0;
    }

    // currently we only support invalid statements for signature completion
    // we could possible support call expressions as well
    if (empty(outerResult) || empty(outerResult.node)) {
      return undefined;
    }

    // determine the identifier of the invalid statement and parameter index
    const { node } = outerResult;

    // check if suffix
    if (node instanceof Expr.Suffix) {
      const tracker = node.mostResolveTracker();

      if (empty(tracker)) {
        return undefined;
      }

      switch (tracker.declared.symbol.tag) {
        case KsSymbolKind.function:
        case KsSymbolKind.suffix:
          return {
            index,
            tracker,
          };
        default:
          return undefined;
      }
    }

    // check if invalid statment
    if (node instanceof Stmt.Invalid) {
      const { ranges } = node;
      const indices = binarySearchIndex(ranges, pos);
      const start = Array.isArray(indices) ? indices[0] : indices;

      for (let i = start; i >= 0; i -= 1) {
        const element = ranges[i];

        if (element instanceof Expr.Suffix) {
          const tracker = element.mostResolveTracker();

          if (!empty(tracker)) {
            switch (tracker.declared.symbol.tag) {
              case KsSymbolKind.function:
              case KsSymbolKind.suffix:
                return {
                  index,
                  tracker,
                };
              default:
                return undefined;
            }
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Load and validate a document. First by attempting a lookup on previously validated
   * documents. if the document is not found it is read from disk and validated
   * @param parentUri uri of the parent document
   * @param loadDat information describing what should be loaded
   * @param depth TODO remove: depeth of the current graph.
   */
  private async *loadAndValidateDocument(
    parentUri: string,
    { uri, caller }: ILoadData,
    depth: number,
  ): AsyncIterableIterator<ValidateResult> {
    try {
      // non ideal fix for depedency cycle
      // TODO we need to actually check for cycles and do something else
      if (depth > 10) {
        return { diagnostics: [] };
      }

      // if cache not found attempt to find file from disk
      // TODO
      const validated = this.tryFindDocument(uri.fsPath, uri.toString());
      if (empty(validated)) {
        return {
          diagnostics: [
            {
              uri: parentUri,
              range: caller,
              severity: DiagnosticSeverity.Error,
              message: `Unable to find ${uri.fsPath}`,
            },
          ],
        };
      }

      // attempt to read file from disk
      const fileResult = await readFileAsync(validated.path, 'utf-8');
      yield* this.validateDocument_(validated.uri, fileResult, depth + 1);
    } catch (err) {
      // if we already checked for the file exists but failed anyways??
      return {
        diagnostics: [
          {
            uri: parentUri,
            range: caller,
            severity: DiagnosticSeverity.Error,
            message: `Unable to read ${uri.fsPath}`,
          },
        ],
      };
    }
  }

  /**
   * Main validation function for a document. Lexically and semantically understands a document.
   * Will additionally perform the same analysis on other run scripts found in this script
   * @param uri uri of the document
   * @param text source text of the document
   * @param depth TODO remove: current depth of the document
   */
  private async *validateDocument_(
    uri: string,
    text: string,
    depth: number,
  ): AsyncIterableIterator<ValidateResult> {
    const { script, parseErrors, scanErrors } = await this.parseDocument(
      uri,
      text,
    );
    const symbolTables: SymbolTable[] = [];

    const scanDiagnostics = scanErrors.map(scanError =>
      addDiagnosticsUri(scanError, uri),
    );
    const parserDiagnostics =
      parseErrors.length === 0
        ? []
        : parseErrors
            .map(error => error.inner.concat(error))
            .reduce((acc, current) => acc.concat(current))
            .map(error => parseToDiagnostics(error, uri));

    yield scanDiagnostics.concat(parserDiagnostics);

    // if any run statement exist get uri then load
    if (script.runStmts.length > 0 && this.pathResolver.ready) {
      const loadDatas = this.getValidUri(uri, script.runStmts);

      // for each document run validate and yield any results
      for (const loadData of loadDatas) {
        for await (const result of this.loadAndValidateDocument(
          uri,
          loadData,
          depth + 1,
        )) {
          if (Array.isArray(result)) {
            yield result;
          } else {
            symbolTables.push(result);
          }
        }
      }
    }

    this.logger.info('');
    this.logger.info('-------------Semantic Analysis------------');

    // generate a scope manager for resolving
    const symbolTableBuilder = new SymbolTableBuilder(uri, this.logger);

    // add child scopes
    for (const symbolTable of symbolTables) {
      symbolTableBuilder.linkTable(symbolTable);
    }

    // add standard library
    symbolTableBuilder.linkTable(this.standardLibrary);
    symbolTableBuilder.linkTable(this.activeBodyLibrary());

    // generate resolvers
    const preResolver = new PreResolver(
      script,
      symbolTableBuilder,
      this.logger,
      this.tracer,
    );
    const resolver = new Resolver(
      script,
      symbolTableBuilder,
      this.logger,
      this.tracer,
    );

    // traverse the ast to find functions to pre populate symbol table
    performance.mark('pre-resolver-start');
    const preDiagnostics = preResolver
      .resolve()
      .map(error => addDiagnosticsUri(error, uri));

    yield preDiagnostics;
    performance.mark('pre-resolver-end');

    // traverse the ast again to resolve the remaning symbols
    performance.mark('resolver-start');
    const resolverDiagnostics = resolver
      .resolve()
      .map(error => addDiagnosticsUri(error, uri));

    yield resolverDiagnostics;

    // find scopes were symbols were never used
    const unusedDiagnostics = symbolTableBuilder
      .findUnused()
      .map(error => addDiagnosticsUri(error, uri));

    yield unusedDiagnostics;
    performance.mark('resolver-end');

    // build the final symbol table
    const symbolTable = symbolTableBuilder.build();

    // perform type checking
    const typeChecker = new TypeChecker(script, this.logger, this.tracer);

    performance.mark('type-checking-start');

    typeChecker.check().map(error => addDiagnosticsUri(error, uri));

    // yield typeDiagnostics;
    performance.mark('type-checking-end');

    // measure performance
    performance.measure(
      'Pre Resolver',
      'pre-resolver-start',
      'pre-resolver-end',
    );
    performance.measure('Resolver', 'resolver-start', 'resolver-end');
    performance.measure(
      'Type Checking',
      'type-checking-start',
      'type-checking-end',
    );

    // make sure to delete references so scope manager can be gc'ed
    let documentInfo: Maybe<IDocumentInfo> = this.documentInfos.get(uri);
    if (!empty(documentInfo)) {
      documentInfo.symbolsTable.removeSelf();
      documentInfo = undefined;
    }

    this.documentInfos.set(uri, {
      script,
      symbolsTable: symbolTable,
      diagnostics: scanDiagnostics.concat(
        parserDiagnostics,
        preDiagnostics,
        resolverDiagnostics,
        // typeDiagnostics,
      ),
    });

    this.logger.info('--------------------------------------');
    performance.clearMarks();

    yield symbolTable;
  }

  /**
   * Generate a ast from the provided source text
   * @param uri uri to document
   * @param text source text of document
   */
  private async parseDocument(
    uri: string,
    text: string,
  ): Promise<ScriptResult> {
    this.logger.info('');
    this.logger.info('-------------Lexical Analysis------------');

    performance.mark('scanner-start');
    const scanner = new Scanner(text, uri, this.logger, this.tracer);
    const { tokens, scanErrors } = scanner.scanTokens();
    performance.mark('scanner-end');

    // if scanner found errors report those immediately
    if (scanErrors.length > 0) {
      this.logger.warn(`Scanning encountered ${scanErrors.length} Errors.`);
    }

    performance.mark('parser-start');
    const parser = new Parser(uri, tokens, this.logger, this.tracer);
    const result = parser.parse();
    performance.mark('parser-end');

    // measure performance
    performance.measure('Scanner', 'scanner-start', 'scanner-end');
    performance.measure('Parser', 'parser-start', 'parser-end');
    performance.clearMarks();

    this.logger.info('--------------------------------------');

    return {
      scanErrors,
      ...result,
    };
  }

  /**
   * Get all valid uris from the documents run statements
   * @param uri uri of the calling document
   * @param runStmts run statements in the document
   */
  private getValidUri(uri: string, runStmts: RunStmtType[]): ILoadData[] {
    // generate uris then remove empty or preloaded documents
    return runStmts
      .map(stmt =>
        this.pathResolver.resolveUri(
          {
            uri,
            range: { start: stmt.start, end: stmt.end },
          },
          runPath(stmt),
        ),
      )
      .filter(notEmpty);
  }

  /**
   * Try to find a document in the workspace
   * @param path path to file
   * @param uri uri to file
   */
  private tryFindDocument(
    path: string,
    uri: string,
  ): Maybe<{ path: string; uri: string }> {
    const ext = extname(path);

    switch (ext) {
      case '.ks':
        // case '.ksm': probably need to report we can't read ksm files
        if (existsSync(path)) {
          return { path, uri };
        }

        return undefined;
      case '':
        if (existsSync(`${path}.ks`)) {
          return { path: `${path}.ks`, uri: `${uri}.ks` };
        }
        return undefined;
      default:
        return undefined;
    }
  }

  /**
   * Get the symbol table corresponding active set of celetrial bodies for the user.
   * This allows for bodies other than that in stock ksp to be incorporated
   */
  private activeBodyLibrary(): SymbolTable {
    /** TODO actually load other bodies */
    return this.bodyLibrary;
  }
}

// convert parse error to diagnostic
const parseToDiagnostics = (
  error: IParseError,
  uri: string,
): IDiagnosticUri => {
  return {
    uri,
    severity: DiagnosticSeverity.Error,
    range: { start: error.start, end: error.end },
    message: error.message,
    source: 'kos-language-server',
  };
};

// convert resolver error to diagnostic
const addDiagnosticsUri = (error: Diagnostic, uri: string): IDiagnosticUri => {
  return { uri, ...error };
};
