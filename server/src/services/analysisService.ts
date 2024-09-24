import {
  DiagnosticUri,
  DocumentInfo,
  LoadedDocuments,
  LexicalInfo,
  SemanticInfo,
  DependencyInfo,
  LexiconLoad as LoadLexicon,
} from '../types';
import { SymbolTable } from '../analysis/models/symbolTable';
import { RunStmtType, IScript } from '../parser/types';
import { SymbolTableBuilder } from '../analysis/models/symbolTableBuilder';
import { PreResolver } from '../analysis/preResolver';
import { performance, PerformanceObserver } from 'perf_hooks';
import { TypeChecker } from '../typeChecker/typeChecker';
import { empty, notEmpty, unWrap } from '../utilities/typeGuards';
import { Scanner } from '../scanner/scanner';
import { Parser } from '../parser/parser';
import {
  TextDocument,
  Diagnostic,
  DiagnosticSeverity,
  Location,
} from 'vscode-languageserver';
import { addDiagnosticsUri } from '../utilities/serverUtils';
import { DocumentService } from './documentService';
import { logException } from '../models/logger';
import { Resolver } from '../analysis/resolver';
import {
  standardLibraryBuilder,
  bodyLibraryBuilder,
} from '../analysis/standardLibrary';
import { ControlFlow } from '../controlFlow/controlFlow';
import { runPath, normalizeExtensions } from '../utilities/pathUtils';
import { ResolverService } from './resolverService';
import { Graph } from '../models/graph';
import { scc, dfs } from '../utilities/graphUtils';
import {
  DIAGNOSTICS,
  createDiagnosticUri,
} from '../utilities/diagnosticsUtils';
import { debounce } from '../utilities/debounce';
import { union, disjoint, setEqual } from 'ts-set-utils';
import { EventEmitter } from 'events';
import { DEFAULT_BODIES } from '../utilities/constants';
import { directiveParser } from '../directives/directiveParser';
import { Include } from '../directives/include';

type ChangeHandler = (diagnostics: DiagnosticUri[]) => void;

export declare interface AnalysisService {
  on(event: 'propagate', listener: ChangeHandler): this;
  emit(event: 'propagate', ...args: Parameters<ChangeHandler>): boolean;
}

export class AnalysisService extends EventEmitter {
  /**
   * A logger for message and error logger
   */
  private readonly logger: ILogger;

  /**
   * A tracer to follow where exceptions occur
   */
  private readonly tracer: ITracer;

  /**
   * Performance observer for tracking analysis speed
   */
  private readonly observer: PerformanceObserver;

  /**
   * A service to load documents
   */
  private readonly documentService: DocumentService;

  /**
   * A service to resolver kos paths
   */
  private readonly resolverService: ResolverService;

  /**
   * A cache of lexical info for each document
   */
  private readonly lexicalCache: Map<string, LexicalInfo>;

  /**
   * A cache of semantic info for each document
   */
  private readonly semanticCache: Map<string, SemanticInfo>;

  /**
   * A cache of other diagnostics for each document
   */
  private readonly dependencyCache: Map<string, DependencyInfo>;

  /**
   * The set of files to eventually propagate changes to
   */
  private readonly changes: Set<string>;

  /**
   * debounce'd propagate changes to execute on a queued changes
   */
  private readonly debouncePropagateChange: () => void;

  /**
   * The current loaded standard library
   */
  private standardLibrary: SymbolTable;

  /**
   * The current loaded celestial body library
   */
  private bodyLibrary: SymbolTable;

  /**
   * The current requested completion case
   */
  private caseKind: CaseKind;

  /**
   * The current set of celestialBodies
   */
  private celestialBodies: string[];

  /**
   * Construct a new analysis service
   * @param caseKind the typing case of the build in standard and body libraries
   * @param logger A logger to log performance and exception
   * @param tracer a tracer to location exceptions
   * @param documentService The document service to load new files from disk
   * @param resolverService A service to resolver kos paths
   */
  constructor(
    caseKind: CaseKind,
    logger: ILogger,
    tracer: ITracer,
    documentService: DocumentService,
    resolverService: ResolverService,
  ) {
    super();

    // initialize services
    this.logger = logger;
    this.tracer = tracer;
    this.documentService = documentService;
    this.resolverService = resolverService;

    // create caches
    this.lexicalCache = new Map();
    this.semanticCache = new Map();
    this.dependencyCache = new Map();

    this.changes = new Set();
    this.debouncePropagateChange = debounce(
      4000,
      this.propagateChanges.bind(this),
    );

    // configure analysis service
    this.caseKind = caseKind;
    this.celestialBodies = DEFAULT_BODIES;
    this.standardLibrary = standardLibraryBuilder(caseKind);
    this.bodyLibrary = bodyLibraryBuilder(caseKind, DEFAULT_BODIES);

    this.observer = new PerformanceObserver((list) => {
      this.logger.info('');
      this.logger.info('-------- Performance ---------');
      for (const entry of list.getEntries()) {
        this.logger.info(`${entry.name} took ${entry.duration} ms`);
      }
      this.logger.info('------------------------------');
    });
    this.observer.observe({ entryTypes: ['measure'], buffered: true });
  }

  /**
   * Set the case of the body library and standard library
   * @param caseKind case to set
   */
  public setCase(caseKind: CaseKind): this {
    if (this.caseKind !== caseKind) {
      this.caseKind = caseKind;
      this.standardLibrary = standardLibraryBuilder(caseKind);
      this.bodyLibrary = bodyLibraryBuilder(caseKind, this.celestialBodies);
    }

    return this;
  }

  /**
   * Set the current bodies that should be completed
   * @param bodies
   */
  public setBodies(bodies: string[]): this {
    if (!setEqual(new Set(...bodies), new Set(this.celestialBodies))) {
      this.bodyLibrary = bodyLibraryBuilder(this.caseKind, bodies);
    }

    return this;
  }

  /**
   * Validate a document in asynchronous stages. This produces diagnostics about known errors or
   * potential problems in the provided script
   * @param uri uri of the document
   * @param text source text of the document
   */
  public async analyzeDocument(
    uri: string,
    text: string,
  ): Promise<DiagnosticUri[]> {
    try {
      // analyze document
      const documentInfo = await this.analyze(uri, text);

      // set cache and update changes queue
      this.setDocumentCache(uri, documentInfo);
      this.queueChanges(uri);

      return this.documentInfoDiagnostics(documentInfo);
    } catch (err) {
      logException(this.logger, this.tracer, err, LogLevel.error);
      return [];
    }
  }

  /**
   * Get a document info if it exists
   */
  public async loadInfo(uri: string): Promise<Maybe<DocumentInfo>> {
    // check if document has already been analyzed
    const documentInfo = this.getInfo(uri);
    if (!empty(documentInfo)) {
      return documentInfo;
    }

    try {
      // attempt to load document from file
      const document = await this.documentService.loadDocument(uri);
      if (empty(document)) {
        return undefined;
      }

      const result = await this.analyze(uri, document.getText());

      this.setDocumentCache(uri, result);
      return this.isFull(result) ? result : undefined;
    } catch (err) {
      logException(this.logger, this.tracer, err, LogLevel.error);
      return undefined;
    }
  }

  /**
   * Get the full document in from the individual caches
   * @param uri document uri to check against
   */
  public getInfo(uri: string): Maybe<DocumentInfo> {
    const lexicalInfo = this.lexicalCache.get(uri);
    const semanticInfo = this.semanticCache.get(uri);
    const otherDiagnostics = this.dependencyCache.get(uri);

    if (
      !empty(lexicalInfo) &&
      !empty(semanticInfo) &&
      !empty(otherDiagnostics)
    ) {
      return { lexicalInfo, semanticInfo, dependencyInfo: otherDiagnostics };
    }

    return undefined;
  }

  /**
   * Load full directory with initial set of diagnostics
   */
  public async loadDirectory(): Promise<DiagnosticUri[]> {
    await this.documentService.cacheDocuments();
    const { diagnostics, lexicon } = await this.loadLexicon();
    const graph = this.documentGraph(lexicon);

    // Determine strongly connected components
    const sccResult = scc(graph);
    const loaded = new Set<string>();

    // move bottom up
    for (let i = sccResult.components.length - 1; i >= 0; i -= 1) {
      for (const lexicalInfo of sccResult.components[i]) {
        // load dependencies
        const dependencyInfo = await this.getDependencies(
          lexicalInfo.script.uri,
          loaded,
        );

        if (empty(dependencyInfo)) {
          continue;
        }

        diagnostics.push(...dependencyInfo.diagnostics);

        // analyze semantics
        const semanticInfo = await this.getSemantics(
          lexicalInfo.script.uri,
          loaded,
        );
        if (empty(semanticInfo)) {
          continue;
        }
        diagnostics.push(...semanticInfo.diagnostics);
      }
    }

    return diagnostics;
  }

  /**
   * Main validation function for a document. Lexically and semantically understands a document.
   * Will additionally perform the same analysis on other run scripts found in this script
   * @param uri uri of the document
   * @param text source text of the document
   */
  private async analyze(
    uri: string,
    text: string,
  ): Promise<Partial<DocumentInfo>> {
    // preform lexical analysis
    const lexicalInfo = this.analyzeLexicon(uri, text);

    // load dependencies found in the ast
    const dependencyInfo = await this.loadDependencies(
      uri,
      lexicalInfo.script,
      lexicalInfo.directives.include,
      new Set(),
    );

    // perform semantic analysis
    const semanticInfo = this.analyzeSemantics(
      uri,
      lexicalInfo.script,
      dependencyInfo.dependencyTables,
    );

    // clear performance observer marks
    performance.clearMarks();

    // generate the document info
    return {
      lexicalInfo,
      semanticInfo,
      dependencyInfo,
    };
  }

  /**
   * Function to be debounce'd in order to propagate changes indirectly affected
   * files
   */
  private async propagateChanges(): Promise<void> {
    const { lexicon } = await this.loadLexicon();

    const documentGraph = this.documentGraph(lexicon);
    const documentComponentGraph = scc(documentGraph).componentGraph();

    const directlyAffected = new Set(
      [...this.changes].map((c) => lexicon.get(c)).filter(notEmpty),
    );

    const affectedSets: Set<LexicalInfo>[] = [];
    for (const source of documentComponentGraph.sources()) {
      const first = [...source.values()][0];

      const visited = new Set<LexicalInfo>();
      dfs(documentGraph, first, visited);
      if (!disjoint(directlyAffected, visited)) {
        affectedSets.push(visited);
      }
    }
    const affected = union(...affectedSets);
    const affectedGraph = this.documentGraph(
      new Map([...affected].map((affected) => [affected.script.uri, affected])),
    );

    const affectedScc = scc(affectedGraph);
    const diagnostics: DiagnosticUri[] = [];

    for (const component of affectedScc.components.reverse()) {
      for (const { script } of component) {
        const document = this.documentService.getDocument(script.uri);
        const documentInfo = await this.analyze(
          script.uri,
          unWrap(document).getText(),
        );

        diagnostics.push(...this.documentInfoDiagnostics(documentInfo));
      }
    }

    this.emit('propagate', diagnostics);
    this.changes.clear();
  }

  /**
   * Add a file to to the set of files to eventually process
   * @param uri document uri to enqueue
   */
  private queueChanges(uri: string) {
    this.changes.add(uri);
    this.debouncePropagateChange();
  }

  /**
   * Determine the document graph of the current root directory
   */
  private documentGraph(
    lexicalMap: Map<string, LexicalInfo>,
  ): Graph<LexicalInfo> {
    // generate graph nodes
    const graph = new Graph(...lexicalMap.values());

    // loop through ever nodes and it's run statements
    for (const [uri, lexicalInfo] of lexicalMap) {
      for (const runStmt of lexicalInfo.script.runStmts) {
        // get underlying run path
        const path = runPath(runStmt);

        if (typeof path !== 'string') {
          break;
        }

        // attempt to resolve to normalized path
        const resolved = this.resolverService.resolve(
          runStmt.toLocation(uri),
          path,
        );

        if (empty(resolved)) {
          break;
        }

        const normalized = normalizeExtensions(resolved);
        if (empty(normalized)) {
          break;
        }

        const sink = lexicalMap.get(normalized);
        if (empty(sink)) {
          break;
        }

        // add graph edge
        graph.addEdge(lexicalInfo, sink);
      }
    }

    return graph;
  }

  /**
   * Load the lexicon of all available documents
   */
  private async loadLexicon(): Promise<LoadLexicon> {
    const lexicon: Map<string, LexicalInfo> = new Map();
    const diagnostics: DiagnosticUri[] = [];

    // enumerate all documents in the directory
    for (const document of this.documentService.getAllDocuments()) {
      // // perform lexical analysis
      const lexicalInfo = await this.getLexicon(document.uri);

      if (!empty(lexicalInfo)) {
        diagnostics.push(...lexicalInfo.diagnostics);
        lexicon.set(document.uri, lexicalInfo);
        this.lexicalCache.set(document.uri, lexicalInfo);
      }
    }

    return {
      lexicon,
      diagnostics,
    };
  }

  /**
   * Perform lexical analysis on the provided provided source text
   * @param uri uri to document
   * @param text source text of document
   */
  private analyzeLexicon(uri: string, text: string): LexicalInfo {
    this.logger.verbose('');
    this.logger.verbose('-------------Lexical Analysis------------');

    performance.mark('scanner-start');
    const scanner = new Scanner(text, uri, this.logger, this.tracer);
    const {
      tokens,
      diagnostics: scanDiagnostics,
      directiveTokens,
    } = scanner.scanTokens();
    performance.mark('scanner-end');

    // if scanner found errors report those immediately
    if (scanDiagnostics.length > 0) {
      this.logger.warn(
        `Scanning encountered ${scanDiagnostics.length} Errors.`,
      );
    }

    performance.mark('parser-start');
    const parser = new Parser(uri, tokens, this.logger, this.tracer);
    const { script, diagnostics: parseDiagnostics } = parser.parse();
    performance.mark('parser-end');

    performance.mark('parser-start');
    const { directives, diagnostics: directiveDiagnostics } = directiveParser(
      directiveTokens,
    );
    performance.mark('parser-end');

    // measure performance
    performance.measure('Scanner', 'scanner-start', 'scanner-end');
    performance.measure('Parser', 'parser-start', 'parser-end');
    performance.clearMarks();

    this.logger.verbose('--------------------------------------');

    const lexicalInfo = {
      script,
      directives,
      diagnostics: [
        ...scanDiagnostics,
        ...parseDiagnostics,
        ...directiveDiagnostics,
      ],
    };

    this.lexicalCache.set(uri, lexicalInfo);
    return lexicalInfo;
  }

  /**
   * Get lexical information about a document from a cache or file
   * @param uri uri to document
   */
  private async getLexicon(uri: string): Promise<Maybe<LexicalInfo>> {
    const cache = this.lexicalCache.get(uri);
    if (!empty(cache)) {
      return cache;
    }

    const document = await this.documentService.loadDocument(uri);
    if (empty(document)) {
      return undefined;
    }

    return this.analyzeLexicon(uri, document.getText());
  }

  /**
   * Perform semantic analysis on the an ast and provided dependency symbol tables
   * @param uri uri to document
   * @param script Ast of the document
   * @param tables symbol tables that are dependencies of this document
   */
  private analyzeSemantics(
    uri: string,
    script: IScript,
    tables: Set<SymbolTable>,
  ): SemanticInfo {
    this.logger.verbose('');
    this.logger.verbose('-------------Semantic Analysis------------');

    // generate a scope manager for resolving
    const symbolTableBuilder = new SymbolTableBuilder(uri, this.logger);
    let oldSemanticInfo = this.semanticCache.get(uri);

    // add symbol tables that are dependent
    if (!empty(oldSemanticInfo)) {
      for (const dependent of oldSemanticInfo.symbolTable.dependentTables) {
        symbolTableBuilder.linkDependent(dependent);
      }

      oldSemanticInfo.symbolTable.removeSelf();
    }

    // add symbol tables that are dependencies
    for (const symbolTable of tables) {
      symbolTableBuilder.linkDependency(symbolTable);
    }

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
    const resolverDiagnostics = preResolver
      .resolve()
      .map((error) => addDiagnosticsUri(error, uri));

    performance.mark('pre-resolver-end');

    // traverse the ast again to resolve the remaining symbols
    performance.mark('resolver-start');
    resolverDiagnostics.push(
      ...resolver.resolve().map((error) => addDiagnosticsUri(error, uri)),
    );

    // find scopes were symbols were never used
    resolverDiagnostics.push(
      ...symbolTableBuilder
        .findUnused()
        .map((error) => addDiagnosticsUri(error, uri)),
    );

    performance.mark('resolver-end');

    // build the final symbol table
    const symbolTable = symbolTableBuilder.build();

    // make sure to delete references so scope manager can be gc'ed
    if (!empty(oldSemanticInfo)) {
      oldSemanticInfo.symbolTable.removeSelf();
      oldSemanticInfo = undefined;
    }

    const controlFlow = new ControlFlow(script, this.logger, this.tracer);

    performance.mark('control-flow-start');

    const flowGraph = controlFlow.flow();

    const flowDiagnostics = empty(flowGraph)
      ? []
      : flowGraph
          .reachable()
          .map((diagnostic) => addDiagnosticsUri(diagnostic, uri));

    performance.mark('control-flow-end');

    // perform type checking
    const typeChecker = new TypeChecker(script, this.logger, this.tracer);

    performance.mark('type-checking-start');

    const typeDiagnostics = typeChecker
      .check()
      .map((error) => addDiagnosticsUri(error, uri));

    performance.mark('type-checking-end');

    // measure performance
    performance.measure(
      'Pre Resolver',
      'pre-resolver-start',
      'pre-resolver-end',
    );
    performance.measure('Resolver', 'resolver-start', 'resolver-end');
    performance.measure(
      'Control Flow',
      'control-flow-start',
      'control-flow-end',
    );
    performance.measure(
      'Type Checking',
      'type-checking-start',
      'type-checking-end',
    );

    this.logger.verbose('--------------------------------------');

    const semanticInfo = {
      symbolTable,
      diagnostics: [
        ...flowDiagnostics,
        ...typeDiagnostics,
        ...resolverDiagnostics,
      ],
    };

    this.semanticCache.set(uri, semanticInfo);
    return semanticInfo;
  }

  /**
   * Get semantic information about a document from a cache or file
   * @param uri uri to document
   */
  private async getSemantics(
    uri: string,
    loaded: Set<string>,
  ): Promise<Maybe<SemanticInfo>> {
    const cache = this.semanticCache.get(uri);
    if (!empty(cache)) {
      return cache;
    }

    const lexicalInfo = await this.getLexicon(uri);
    if (empty(lexicalInfo)) {
      return undefined;
    }

    const dependencyInfo = await this.getDependencies(uri, loaded);
    if (empty(dependencyInfo)) {
      return undefined;
    }

    return this.analyzeSemantics(
      uri,
      lexicalInfo.script,
      dependencyInfo.dependencyTables,
    );
  }

  /**
   * Load dependencies either from cache or by perform analysis on them as well
   * @param uri uri to document
   * @param script Ast of the document
   * @param includes include directives
   * @param loaded already loaded uri's
   */
  private async loadDependencies(
    uri: string,
    script: IScript,
    includes: Include[],
    loaded: Set<string>,
  ): Promise<DependencyInfo> {
    // pre-fill dependency tables with standard library
    const result: DependencyInfo = {
      dependencyTables: new Set([
        this.activeStandardLibrary(),
        this.activeBodyLibrary(),
      ]),
      diagnostics: [],
    };

    if (loaded.has(uri)) {
      return result;
    }
    loaded.add(uri);

    // if any run statement exist get uri then load
    if (
      (script.runStmts.length > 0 || includes.length > 0) &&
      this.documentService.ready()
    ) {
      const { documents, diagnostics } = await this.loadDocuments(
        uri,
        script.runStmts,
        includes,
      );

      // add diagnostics related to the actual load
      result.diagnostics.push(
        ...diagnostics.map((error) => addDiagnosticsUri(error, uri)),
      );

      // for each document run validate and yield any results
      for (const document of documents) {
        const lexicalInfo = await this.getLexicon(document.uri);
        if (empty(lexicalInfo)) {
          continue;
        }

        const dependencyInfo = await this.loadDependencies(
          document.uri,
          lexicalInfo.script,
          lexicalInfo.directives.include,
          loaded,
        );
        const semanticInfo = await this.getSemantics(document.uri, loaded);

        if (!empty(semanticInfo)) {
          result.dependencyTables.add(semanticInfo.symbolTable);
        }

        result.diagnostics.push(...dependencyInfo.diagnostics);
      }
    }

    this.dependencyCache.set(uri, result);
    return result;
  }

  /**
   * Get dependencies for a document from a cache or file
   * @param uri uri to document
   */
  private async getDependencies(
    uri: string,
    loaded: Set<string>,
  ): Promise<Maybe<DependencyInfo>> {
    const cache = this.dependencyCache.get(uri);
    if (!empty(cache)) {
      return cache;
    }

    const lexicalInfo = await this.getLexicon(uri);
    if (empty(lexicalInfo)) {
      return undefined;
    }

    return this.loadDependencies(
      uri,
      lexicalInfo.script,
      lexicalInfo.directives.include,
      loaded,
    );
  }

  /**
   * Get all valid uris from the documents run statements
   * @param uri uri of the calling document
   * @param runStmts run statements in the document
   * @param includes include directives within the file
   */
  private async loadDocuments(
    uri: string,
    runStmts: RunStmtType[],
    includes: Include[],
  ): Promise<LoadedDocuments> {
    const documents: TextDocument[] = [];
    const diagnostics: Diagnostic[] = [];

    // retrieve path from run statements
    for (const runStmt of runStmts) {
      const path = runPath(runStmt);
      if (typeof path !== 'string') {
        diagnostics.push(path);
        continue;
      }

      const result = await this.loadDocument(runStmt.toLocation(uri), path);

      if (TextDocument.is(result)) {
        documents.push(result);
      } else {
        diagnostics.push(result);
      }
    }

    // retrieve path from include directives
    for (const include of includes) {
      const result = await this.loadDocument(
        include.directive,
        include.includePath(),
      );

      if (TextDocument.is(result)) {
        documents.push(result);
      } else {
        diagnostics.push(result);
      }
    }

    // return loaded documents and load errors
    return {
      documents,
      diagnostics,
    };
  }

  /**
   * Load a single document from a given call location resolve to a provided path
   * @param location location of the include / run
   * @param path path to the document to load
   */
  private async loadDocument(location: Location, path: string) {
    // resolve path to uri
    const runUri = this.resolverService.resolve(location, path);

    if (empty(runUri)) {
      return this.loadError(location, path);
    }

    // load document from uri
    const document = await this.documentService.loadDocument(runUri.toString());

    return empty(document) ? this.loadError(location, path) : document;
  }

  /**
   * Extract all diagnostics from a document info
   * @param documentInfo document info
   */
  private documentInfoDiagnostics(
    documentInfo: Partial<DocumentInfo>,
  ): DiagnosticUri[] {
    const { lexicalInfo, semanticInfo, dependencyInfo } = documentInfo;

    const diagnostics: DiagnosticUri[] = [];
    if (!empty(lexicalInfo)) {
      diagnostics.push(...lexicalInfo.diagnostics);
    }

    if (!empty(semanticInfo)) {
      diagnostics.push(...semanticInfo.diagnostics);
    }

    if (!empty(dependencyInfo)) {
      diagnostics.push(...dependencyInfo.diagnostics);
    }

    return diagnostics;
  }

  /**
   * Set all the individual caches for a document info
   * @param uri document uri to set
   * @param documentInfo document info to set
   */
  private setDocumentCache(
    uri: string,
    documentInfo: Partial<DocumentInfo>,
  ): void {
    // check cache for existing document info
    if (empty(documentInfo.lexicalInfo)) {
      this.lexicalCache.delete(uri);
    } else {
      this.lexicalCache.set(uri, documentInfo.lexicalInfo);
    }

    if (empty(documentInfo.semanticInfo)) {
      this.semanticCache.delete(uri);
    } else {
      this.semanticCache.set(uri, documentInfo.semanticInfo);
    }

    if (empty(documentInfo.dependencyInfo)) {
      this.dependencyCache.delete(uri);
    } else {
      this.dependencyCache.set(uri, documentInfo.dependencyInfo);
    }
  }

  /**
   * Is this partial document info actually full
   * @param partial potentially partial document info
   */
  private isFull(partial: Partial<DocumentInfo>): partial is DocumentInfo {
    return (
      !empty(partial.lexicalInfo) &&
      !empty(partial.semanticInfo) &&
      !empty(partial.dependencyInfo)
    );
  }

  /**
   * Generate a loading diagnostic if file cannot be loaded
   * @param location location of the load statement run or #include
   * @param path kos path of the file
   */
  private loadError(location: Location, path: string) {
    return createDiagnosticUri(
      location,
      `Unable to load script at ${path}`,
      DiagnosticSeverity.Information,
      DIAGNOSTICS.LOAD_ERROR,
    );
  }

  /**
   * Get the symbol table corresponding to the active standard library. For now this
   * will just be the default library but this may allow us to eventually support multiple
   * version of kOS
   */
  private activeStandardLibrary(): SymbolTable {
    return this.standardLibrary;
  }

  /**
   * Get the symbol table corresponding active set of celestial bodies for the user.
   * This allows for bodies other than that in stock ksp to be incorporated
   */
  private activeBodyLibrary(): SymbolTable {
    return this.bodyLibrary;
  }
}
