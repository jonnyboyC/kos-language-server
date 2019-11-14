import {
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
  ReferenceParams,
  ParameterInformation,
  SignatureInformation,
  SignatureHelp,
  DocumentSymbolParams,
  SymbolInformation,
  FoldingRangeParams,
  FoldingRange,
  CancellationToken,
  Hover,
  TextDocument,
} from 'vscode-languageserver';
import { KLSConfiguration, ClientConfiguration, DiagnosticUri } from './types';
import { Scanner } from './scanner/scanner';
import {
  KsSymbol,
  KsSymbolKind,
  SymbolTracker,
  KsBaseSymbol,
} from './analysis/types';
import { mockLogger, mockTracer, logException } from './models/logger';
import { empty } from './utilities/typeGuards';
import { ScriptFind, AstContext } from './parser/scriptFind';
import * as Expr from './parser/models/expr';
import * as Stmt from './parser/models/stmt';
import * as SuffixTerm from './parser/models/suffixTerm';
import { builtIn, serverName, keywordCompletions } from './utilities/constants';
import { binarySearchIndex, rangeContains } from './utilities/positionUtils';
import { URI } from 'vscode-uri';
import { DocumentService } from './services/documentService';
import {
  defaultClientConfiguration,
  caseMapper,
  logMapper,
  suffixCompletionItems,
  symbolCompletionItems,
  toDocumentSymbols as toLangServerSymbols,
} from './utilities/serverUtils';
import {
  cleanDiagnostic,
  cleanRange,
  cleanPosition,
  cleanLocation,
} from './utilities/clean';
import { isValidIdentifier } from './models/tokentypes';
import { tokenTrackedType } from './typeChecker/utilities/typeUtilities';
import { TypeKind } from './typeChecker/types';
import { IoService } from './services/IoService';
import { FoldableService } from './services/foldableService';
import { AnalysisService } from './services/analysisService';
import { IFindResult } from './parser/types';
import { ResolverService } from './services/resolverService';
import { runPath } from './utilities/pathUtils';
import { parseWorkspaceConfiguration } from './config/workspaceConfigParser';
import {
  WorkspaceConfiguration,
  defaultWorkspaceConfiguration,
} from './config/workspaceConfiguration';

export class KLS {
  /**
   * What is the workspace uri
   */
  public workspaceUri?: string;

  /**
   * The logger used by this and all dependencies
   */
  private readonly logger: ILogger;

  /**
   * The tracer used by this and all dependencies
   */
  private readonly tracer: ITracer;

  /**defaultClientConfiguration
   * Connection to the client
   */
  private readonly connection: Connection;

  /**
   * The workspace's configuration
   */
  private workspaceConfiguration: WorkspaceConfiguration;

  /**
   * This server's configuration
   */
  private readonly configuration: KLSConfiguration;

  /**
   * The document service to store and manage documents
   */
  private readonly documentService: DocumentService;

  /**
   * A service to take document info and generate all foldable regions
   */
  private readonly foldableService: FoldableService;

  /**
   * A service to provide analysis against scripts
   */
  private readonly analysisService: AnalysisService;

  /**
   * A service to resolve path in kos
   */
  private readonly resolverService: ResolverService;

  /**
   * A service for interacting with io
   */
  private readonly ioService: IoService;

  constructor(
    caseKind: CaseKind = CaseKind.camelCase,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
    connection: Connection,
    configuration: KLSConfiguration,
  ) {
    this.workspaceUri = undefined;
    this.logger = logger;
    this.tracer = tracer;
    this.configuration = configuration;
    this.workspaceConfiguration = defaultWorkspaceConfiguration;
    this.connection = connection;
    this.ioService = new IoService();
    this.resolverService = new ResolverService();
    this.documentService = new DocumentService(
      connection,
      this.ioService,
      logger,
      tracer,
    );
    this.foldableService = new FoldableService();
    this.analysisService = new AnalysisService(
      caseKind,
      this.logger,
      this.tracer,
      this.documentService,
      this.resolverService,
    );

    if (this.workspaceConfiguration) {
    }
  }

  /**
   * Start the language server listening to requests from the client
   */
  public listen(): void {
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
    this.connection.onReferences(this.onReference.bind(this));
    this.connection.onSignatureHelp(this.onSignatureHelp.bind(this));
    this.connection.onDocumentSymbol(this.onDocumentSymbol.bind(this));
    this.connection.onDefinition(this.onDefinition.bind(this));
    this.connection.onFoldingRanges(this.onFoldingRange.bind(this));

    this.documentService.on('change', this.onChange.bind(this));
    this.documentService.on('configChange', this.onConfigChange.bind(this));
    this.analysisService.on('propagate', this.sendDiagnostics.bind(this));

    this.connection.listen();
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

        // Tell the client that the server support signature help
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
        foldingRangeProvider: true,
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
    this.updateServer(clientConfig);
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
   * @param cancellation request cancellation token
   */
  private async onCompletion(
    completion: CompletionParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<CompletionItem[]>> {
    const { textDocument, position } = completion;

    try {
      // exit if cancel requested
      if (cancellation.isCancellationRequested) {
        return undefined;
      }

      // determine if we're inside a suffix of some kind
      const result = await this.findToken(
        position,
        textDocument.uri,
        Expr.Suffix,
      );

      // exit if cancel requested
      if (cancellation.isCancellationRequested) {
        return undefined;
      }

      // if we're not in a suffix just do symbol completion
      if (empty(result) || empty(result.node)) {
        return await symbolCompletionItems(
          this,
          completion,
          this.configuration.keywords,
        );
      }

      const { token, node } = result;

      // check what shouldn't happen
      if (!(node instanceof Expr.Suffix)) {
        throw new Error('Unable to find suffix');
      }

      // if we're in the atom also do symbol completion
      if (rangeContains(node.suffixTerm.atom, token)) {
        return await symbolCompletionItems(
          this,
          completion,
          this.configuration.keywords,
        );
      }

      // if we're not in the atom then we need to complete with suffixes
      return suffixCompletionItems(this, completion);

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
   * @param cancellation request cancellation token
   */
  private async onRenameRequest(
    rename: RenameParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<WorkspaceEdit>> {
    const { newName, position, textDocument } = rename;
    const scanner = new Scanner(newName);

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const { tokens, scanDiagnostics: scanErrors } = scanner.scanTokens();

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

    const locations = await this.getUsageLocations(position, textDocument.uri);
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
   * This handler provides highlight within a requested document. This allows the client
   * to highlight and symbol and other instances of that symbol to also highlight.
   * @param positionParams the position of the highlight request
   * @param cancellation request cancellation token
   */
  private async onDocumentHighlight(
    positionParams: TextDocumentPositionParams,
    cancellation: CancellationToken,
  ): Promise<DocumentHighlight[]> {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return [];
    }

    const locations = await this.getFileUsageRanges(position, uri);
    return empty(locations)
      ? []
      : locations.map(range => ({ range: cleanRange(range) }));
  }

  /**
   * This handler provides on hover capability for symbols in a document. This allows additional
   * information to be displayed to the user about symbols throughout the document
   * @param positionParams the position of the hover request
   * @param cancellation request cancellation token
   */
  private async onHover(
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

    if (empty(type)) {
      return undefined;
    }

    return {
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
    };
  }

  /**
   * This handler provides reference capabilities to symbols in a document. This allows a client
   * to identify all positions that a symbol is used in the document or attached documents
   * @param reference parameters describing the reference request
   * @param cancellation request cancellation token
   */
  private async onReference(
    reference: ReferenceParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<Location[]>> {
    const { position } = reference;
    const { uri } = reference.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const locations = await this.getUsageLocations(position, uri);
    return locations && locations.map(loc => cleanLocation(loc));
  }

  /**
   * This handler provides signature help suffixes and function within the document. This
   * provides extra context to the client such as the current parameter
   * @param positionParams the position of the signature request
   * @param cancellation request cancellation token
   */
  private async onSignatureHelp(
    positionParams: TextDocumentPositionParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<SignatureHelp>> {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const result = await this.getFunctionAtPosition(position, uri);
    if (empty(result)) {
      return undefined;
    }

    const { tracker, index } = result;

    let label =
      typeof tracker.declared.symbol.name === 'string'
        ? tracker.declared.symbol.name
        : tracker.declared.symbol.name.lexeme;

    const type = tracker.getType({
      uri,
      range: { start: position, end: position },
    });

    if (empty(type)) {
      return undefined;
    }

    switch (type.kind) {
      case TypeKind.function:
      case TypeKind.suffix:
        const callSignature = type.callSignature();

        if (empty(callSignature)) {
          return undefined;
        }

        let start = label.length + 1;
        const params = callSignature.params();
        const paramInfos: ParameterInformation[] = [];

        // check if normal or variadic type
        if (params.length === 1 && params[0].kind === TypeKind.variadic) {
          // generate variadic labels
          const variadicLabel = params[0].toString();
          paramInfos.push(
            ParameterInformation.create([start, start + variadicLabel.length]),
          );
          label = `${label}(${variadicLabel})`;
        } else if (params.length > 0) {
          // generate normal labels

          const labels: string[] = [];
          for (let i = 0; i < params.length - 1; i += 1) {
            const paramLabel = `${params[i].toString()}, `;
            paramInfos.push(
              ParameterInformation.create([
                start,
                start + paramLabel.length - 2,
              ]),
            );
            labels.push(paramLabel);
            start = start + paramLabel.length;
          }

          const paramLabel = `${params[params.length - 1].toString()}`;
          paramInfos.push(
            ParameterInformation.create([start, start + paramLabel.length]),
          );
          labels.push(paramLabel);
          label = `${label}(${labels.join('')})`;
        }

        return {
          signatures: [
            SignatureInformation.create(label, undefined, ...paramInfos),
          ],
          activeParameter: index,
          activeSignature: null,
        };
      default:
        return undefined;
    }
  }

  /**
   * This handler provides document symbol capabilities. This provides a list of all
   * symbols that are located within a given document
   * @param documentSymbol the document to provide symbols for
   * @param cancellation request cancellation token
   */
  private async onDocumentSymbol(
    documentSymbol: DocumentSymbolParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<SymbolInformation[]>> {
    const { uri } = documentSymbol.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const entities = await this.getAllFileSymbols(uri);
    return toLangServerSymbols(entities, uri);
  }

  /**
   * This handler provides go to definition capabilities. When a client requests a symbol
   * go to definition this provides the location if it exists
   * @param positionParams the position of the definition request
   * @param cancellation request cancellation token
   */
  private async onDefinition(
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
   * This handler provide folding region capabilities. The client will ask for available folding
   * region in which this will respond with the ranges defined by #region and #endregion
   * @param foldingParams the document to preform folding analysis on
   */
  private async onFoldingRange(
    foldingParams: FoldingRangeParams,
    cancellation: CancellationToken,
  ): Promise<Maybe<FoldingRange[]>> {
    const { uri } = foldingParams.textDocument;

    // exit if cancel requested
    if (cancellation.isCancellationRequested) {
      return undefined;
    }

    const documentInfo = await this.analysisService.getInfo(uri);

    // exit if cancel requested or no document found
    if (cancellation.isCancellationRequested || empty(documentInfo)) {
      return undefined;
    }

    const { script, regions } = documentInfo.lexicalInfo;
    return this.foldableService.findRegions(script, regions);
  }

  /**
   * Respond to updates made to document by the client. This method
   * will parse and update the internal state of affects scripts
   * reporting errors to the client as they are discovered
   * @param document the updated document
   */
  private async onChange(document: TextDocument) {
    try {
      const diagnostic = await this.analysisService.analyzeDocument(
        document.uri,
        document.getText(),
      );

      this.sendDiagnostics(diagnostic, document.uri);
    } catch (err) {
      // report any exceptions to the client
      logException(this.logger, this.tracer, err, LogLevel.error);
    }
  }

  /**
   * Update the workspace configuration on `ksconfig.json` updates
   * @param config updated json
   */
  private async onConfigChange(document: TextDocument) {
    const config = parseWorkspaceConfiguration(document);
    this.workspaceConfiguration = defaultWorkspaceConfiguration.merge(config);
  }

  /**
   * send diagnostics to client
   * @param diagnostics diagnostics to organize and send
   */
  private sendDiagnostics(diagnostics: DiagnosticUri[], uri?: string): void {
    const total = diagnostics.length;
    const diagnosticMap: Map<string, Diagnostic[]> = new Map();

    // retrieve diagnostics from analyzer
    for (const diagnostic of diagnostics) {
      const uriDiagnostics = diagnosticMap.get(diagnostic.uri);
      if (empty(uriDiagnostics)) {
        diagnosticMap.set(diagnostic.uri, [cleanDiagnostic(diagnostic)]);
      } else {
        uriDiagnostics.push(cleanDiagnostic(diagnostic));
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
    if (total === 0 && !empty(uri)) {
      this.connection.sendDiagnostics({
        uri: uri,
        diagnostics: [],
      });
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
   * Update the servers configuration in response to a change in the client configuration
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
  private async setUri(uri: string): Promise<void> {
    const parsed = URI.parse(uri);

    this.resolverService.rootVolume = parsed;
    this.documentService.rootVolume = parsed;
    this.workspaceUri = uri;
    const diagnostics = await this.analysisService.loadDirectory();
    this.sendDiagnostics(diagnostics);
  }

  /**
   * Set the case of the body library and standard library
   * @param caseKind case to set
   */
  public setCase(caseKind: CaseKind) {
    this.configuration.keywords = keywordCompletions(caseKind);
    this.analysisService.setCase(caseKind);
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
    const documentInfo = await this.analysisService.getInfo(uri);
    if (empty(documentInfo)) {
      return undefined;
    }

    // try to find an symbol at the position
    const { script } = documentInfo.lexicalInfo;
    const finder = new ScriptFind();
    return finder.find(script, pos, ...contexts);
  }

  /**
   * Get the declaration location for the token at the provided position
   * @param pos position in the document
   * @param uri uri of the document
   */
  public async getDeclarationLocation(
    pos: Position,
    uri: string,
  ): Promise<Maybe<Location>> {
    const documentInfo = await this.analysisService.getInfo(uri);
    if (empty(documentInfo)) {
      return undefined;
    }

    // try to find an symbol at the position
    const { script } = documentInfo.lexicalInfo;
    const finder = new ScriptFind();
    const result = finder.find(
      script,
      pos,
      Stmt.Run,
      Stmt.RunPath,
      Stmt.RunOncePath,
    );

    if (empty(result)) {
      return undefined;
    }

    // check if symbols exists
    const { token, node } = result;
    if (empty(token.tracker)) {
      // if no tracker it might be a run statement
      if (
        node instanceof Stmt.Run ||
        node instanceof Stmt.RunPath ||
        node instanceof Stmt.RunOncePath
      ) {
        // get the kos run path
        const kosPath = runPath(node);
        if (typeof kosPath !== 'string') {
          return undefined;
        }

        const resolved = this.resolverService.resolve(
          node.toLocation(uri),
          kosPath,
        );

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

      return undefined;
    }

    const { declared } = token.tracker;

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
  public async getUsageLocations(
    pos: Position,
    uri: string,
  ): Promise<Maybe<Location[]>> {
    const documentInfo = await this.analysisService.getInfo(uri);
    if (
      empty(documentInfo) ||
      empty(documentInfo.semanticInfo.symbolTable) ||
      empty(documentInfo.lexicalInfo.script)
    ) {
      return undefined;
    }

    // try to find the symbol at the position
    const { semanticInfo, lexicalInfo } = documentInfo;
    const finder = new ScriptFind();
    const result = finder.find(lexicalInfo.script, pos);

    if (empty(result)) {
      return undefined;
    }

    // try to find the tracker at a given position
    const { token } = result;
    const tracker = semanticInfo.symbolTable.scopedNamedTracker(
      pos,
      token.lookup,
    );
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
  public async getFileUsageRanges(
    pos: Position,
    uri: string,
  ): Promise<Maybe<Range[]>> {
    const locations = await this.getUsageLocations(pos, uri);
    if (empty(locations)) {
      return locations;
    }

    return locations.filter(loc => loc.uri === uri).map(loc => loc.range);
  }

  /**
   * Get all symbols locally in scope at this particular script
   * @param pos position in document
   * @param uri document uri
   */
  public async getScopedSymbols(
    pos: Position,
    uri: string,
  ): Promise<KsBaseSymbol[]> {
    const documentInfo = await this.analysisService.getInfo(uri);

    if (empty(documentInfo)) {
      return [];
    }

    return documentInfo.semanticInfo.symbolTable.scopedSymbols(pos);
  }

  /**
   * Get all symbols imported in this particular script
   * @param uri document uri
   */
  public async getImportedSymbols(uri: string): Promise<KsBaseSymbol[]> {
    const documentInfo = await this.analysisService.getInfo(uri);

    if (empty(documentInfo)) {
      return [];
    }

    return documentInfo.semanticInfo.symbolTable.importedSymbols();
  }

  /**
   * Get all symbols in a provided file
   * @param uri document uri
   */
  public async getAllFileSymbols(uri: string): Promise<KsSymbol[]> {
    const documentInfo = await this.analysisService.getInfo(uri);

    if (empty(documentInfo)) {
      return [];
    }

    return documentInfo.semanticInfo.symbolTable.allSymbols();
  }

  /**
   * Get a function located at the current location
   * @param pos position in the document
   * @param uri document uri
   */
  public async getFunctionAtPosition(
    pos: Position,
    uri: string,
  ): Promise<Maybe<{ tracker: SymbolTracker; index: number }>> {
    // we need the document info to lookup a signature
    const documentInfo = await this.analysisService.getInfo(uri);
    if (empty(documentInfo)) return undefined;

    const { script } = documentInfo.lexicalInfo;
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

    // check if invalid statement
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
}
