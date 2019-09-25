import {
  DiagnosticUri,
  DocumentInfo,
  LoadedDocuments,
  LexicalInfo,
  SemanticInfo,
} from '../types';
import { SymbolTable } from '../analysis/models/symbolTable';
import { RunStmtType, IScript } from '../parser/types';
import { SymbolTableBuilder } from '../analysis/models/symbolTableBuilder';
import { PreResolver } from '../analysis/preResolver';
import { performance, PerformanceObserver } from 'perf_hooks';
import { TypeChecker } from '../typeChecker/typeChecker';
import { empty } from '../utilities/typeGuards';
import { Scanner } from '../scanner/scanner';
import { Parser } from '../parser/parser';
import { TextDocument, Diagnostic } from 'vscode-languageserver';
import { addDiagnosticsUri } from '../utilities/serverUtils';
import { DocumentService } from './documentService';
import { logException } from '../models/logger';
import { Resolver } from '../analysis/resolver';
import {
  standardLibraryBuilder,
  bodyLibraryBuilder,
} from '../analysis/standardLibrary';
import { ControlFlow } from '../controlFlow/controlFlow';
import { runPath } from '../utilities/pathUtils';

interface DependencyLoadResult {
  documentInfos: DocumentInfo[];
  loadDiagnostics: DiagnosticUri[];
}

export class AnalysisService {
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
  private readonly otherDiagnosticCache: Map<string, DiagnosticUri[]>;

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
   * Construct a new analysis service
   * @param caseKind the typing case of the build in standard and body libraries
   * @param logger A logger to log performance and exception
   * @param tracer a tracer to location exceptions
   * @param documentService The document service to load new files from disk
   */
  constructor(
    caseKind: CaseKind,
    logger: ILogger,
    tracer: ITracer,
    documentService: DocumentService,
  ) {
    this.logger = logger;
    this.tracer = tracer;
    this.documentService = documentService;

    this.lexicalCache = new Map();
    this.semanticCache = new Map();
    this.otherDiagnosticCache = new Map();

    this.caseKind = caseKind;
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
  }

  /**
   * Validate a document in asynchronous stages. This produces diagnostics about known errors or
   * potential problems in the provided script
   * @param uri uri of the document
   * @param text source text of the document
   */
  public async validateDocument(
    uri: string,
    text: string,
  ): Promise<DiagnosticUri[]> {
    try {
      const documentInfo = await this.validateDocument_(uri, text, 0);
      const diagnostics: DiagnosticUri[] = [];

      if (!empty(documentInfo)) {
        this.setDocumentInfo(uri, documentInfo);

        diagnostics.push(...documentInfo.lexicalInfo.diagnostics);
        diagnostics.push(...documentInfo.semanticInfo.diagnostics);
        diagnostics.push(...documentInfo.otherDiagnostics);
      }

      return diagnostics;
    } catch (err) {
      logException(this.logger, this.tracer, err, LogLevel.error);
      return [];
    }
  }

  /**
   * Get a document info if it exists
   */
  public async getInfo(uri: string): Promise<Maybe<DocumentInfo>> {
    const documentInfo = this.getDocumentInfo(uri);
    if (!empty(documentInfo)) {
      return documentInfo;
    }

    try {
      const document = await this.documentService.loadDocument(uri);
      if (empty(document)) {
        return undefined;
      }

      const result = await this.validateDocument_(uri, document.getText(), 0);

      if (!empty(result)) {
        this.setDocumentInfo(uri, result);
      }
      return result;
    } catch (err) {
      logException(this.logger, this.tracer, err, LogLevel.error);
      return undefined;
    }
  }

  /**
   * Set the case of the body library and standard library
   * @param caseKind case to set
   */
  public setCase(caseKind: CaseKind) {
    if (this.caseKind !== caseKind) {
      this.caseKind = caseKind;
      this.standardLibrary = standardLibraryBuilder(caseKind);
      this.bodyLibrary = bodyLibraryBuilder(caseKind);
    }
  }

  /**
   * Load full directory with initial set of diagnostics
   */
  public async loadDirectory(): Promise<DiagnosticUri[]> {
    await this.documentService.cacheDocuments();
    debugger;

    const diagnostics: DiagnosticUri[] = [];
    for (const document of this.documentService.getAllDocuments()) {
      const lexicalInfo = this.analyzeLexically(
        document.uri,
        document.getText(),
      );

      diagnostics.push(...lexicalInfo.diagnostics);
    }

    return diagnostics;
  }

  /**
   * Main validation function for a document. Lexically and semantically understands a document.
   * Will additionally perform the same analysis on other run scripts found in this script
   * @param uri uri of the document
   * @param text source text of the document
   * @param depth TODO remove: current depth of the document
   */
  private async validateDocument_(
    uri: string,
    text: string,
    depth: number,
  ): Promise<Maybe<DocumentInfo>> {
    if (depth > 10) {
      return undefined;
    }

    // preform lexical analysis
    const lexicalInfo = this.analyzeLexically(uri, text);
    this.lexicalCache.set(uri, lexicalInfo);

    // load dependencies found in the ast
    const { documentInfos, loadDiagnostics } = await this.loadDependencies(
      uri,
      lexicalInfo.script,
      depth,
    );

    // add standard library to dependencies
    const dependencyTables: Set<SymbolTable> = new Set([
      this.activeStandardLibrary(),
      this.activeBodyLibrary(),
    ]);

    // add run statement dependencies and their dependencies
    for (const documentInfo of documentInfos) {
      dependencyTables.add(documentInfo.semanticInfo.symbolTable);
    }

    // perform semantic analysis
    const semanticInfo = this.semanticAnalysisDocument(
      uri,
      lexicalInfo.script,
      dependencyTables,
    );

    // clear performance observer marks
    performance.clearMarks();

    // generate the document info
    return {
      lexicalInfo,
      semanticInfo,
      otherDiagnostics: loadDiagnostics,
    };
  }

  /**
   * Perform lexical analysis on the provided provided source text
   * @param uri uri to document
   * @param text source text of document
   */
  private analyzeLexically(uri: string, text: string): LexicalInfo {
    this.logger.verbose('');
    this.logger.verbose('-------------Lexical Analysis------------');

    performance.mark('scanner-start');
    const scanner = new Scanner(text, uri, this.logger, this.tracer);
    const { tokens, scanDiagnostics, regions } = scanner.scanTokens();
    performance.mark('scanner-end');

    // if scanner found errors report those immediately
    if (scanDiagnostics.length > 0) {
      this.logger.warn(
        `Scanning encountered ${scanDiagnostics.length} Errors.`,
      );
    }

    performance.mark('parser-start');
    const parser = new Parser(uri, tokens, this.logger, this.tracer);
    const { script, parseDiagnostics } = parser.parse();
    performance.mark('parser-end');

    // measure performance
    performance.measure('Scanner', 'scanner-start', 'scanner-end');
    performance.measure('Parser', 'parser-start', 'parser-end');
    performance.clearMarks();

    this.logger.verbose('--------------------------------------');

    // generate lexical diagnostics
    const scannerDiagnostics = scanDiagnostics.map(scanDiagnostic =>
      addDiagnosticsUri(scanDiagnostic, uri),
    );
    const parserDiagnostics = parseDiagnostics.map(parseDiagnostic =>
      addDiagnosticsUri(parseDiagnostic, uri),
    );

    return {
      script,
      regions,
      diagnostics: [...scannerDiagnostics, ...parserDiagnostics],
    };
  }

  /**
   * Perform semantic analysis on the an ast and provided dependency symbol tables
   * @param uri uri to document
   * @param script Ast of the document
   * @param tables symbol tables that are dependencies of this document
   */
  private semanticAnalysisDocument(
    uri: string,
    script: IScript,
    tables: Set<SymbolTable>,
  ): SemanticInfo {
    this.logger.verbose('');
    this.logger.verbose('-------------Semantic Analysis------------');

    // generate a scope manager for resolving
    const symbolTableBuilder = new SymbolTableBuilder(uri, this.logger);
    let semanticInfo = this.semanticCache.get(uri);

    // add symbol tables that are dependent
    if (!empty(semanticInfo)) {
      for (const dependent of semanticInfo.symbolTable.dependentTables) {
        symbolTableBuilder.linkDependent(dependent);
      }

      semanticInfo.symbolTable.removeSelf();
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
      .map(error => addDiagnosticsUri(error, uri));

    performance.mark('pre-resolver-end');

    // traverse the ast again to resolve the remaining symbols
    performance.mark('resolver-start');
    resolverDiagnostics.push(
      ...resolver.resolve().map(error => addDiagnosticsUri(error, uri)),
    );

    // find scopes were symbols were never used
    resolverDiagnostics.push(
      ...symbolTableBuilder
        .findUnused()
        .map(error => addDiagnosticsUri(error, uri)),
    );

    performance.mark('resolver-end');

    // build the final symbol table
    const symbolTable = symbolTableBuilder.build();

    // make sure to delete references so scope manager can be gc'ed
    if (!empty(semanticInfo)) {
      semanticInfo.symbolTable.removeSelf();
      semanticInfo = undefined;
    }

    const controlFlow = new ControlFlow(script, this.logger, this.tracer);

    performance.mark('control-flow-start');

    const flowGraph = controlFlow.flow();

    const flowDiagnostics = empty(flowGraph)
      ? []
      : flowGraph
          .reachable()
          .map(diagnostic => addDiagnosticsUri(diagnostic, uri));

    performance.mark('control-flow-end');

    // perform type checking
    const typeChecker = new TypeChecker(script, this.logger, this.tracer);

    performance.mark('type-checking-start');

    const typeDiagnostics = typeChecker
      .check()
      .map(error => addDiagnosticsUri(error, uri));

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

    return {
      symbolTable,
      diagnostics: [
        ...flowDiagnostics,
        ...typeDiagnostics,
        ...resolverDiagnostics,
      ],
    };
  }

  /**
   * Load dependencies either from cache or by perform analysis on them as well
   * @param uri uri to document
   * @param script Ast of the document
   * @param depth current resolving depth TODO actually check cycles
   */
  private async loadDependencies(
    uri: string,
    script: IScript,
    depth: number,
  ): Promise<DependencyLoadResult> {
    const result: DependencyLoadResult = {
      documentInfos: [],
      loadDiagnostics: [],
    };

    // if any run statement exist get uri then load
    if (script.runStmts.length > 0 && this.documentService.ready) {
      const { documents, diagnostics } = await this.loadDocuments(
        uri,
        script.runStmts,
      );

      // add diagnostics related to the actual load
      result.loadDiagnostics.push(
        ...diagnostics.map(error => addDiagnosticsUri(error, uri)),
      );

      // for each document run validate and yield any results
      for (const document of documents) {
        const cached = this.getDocumentInfo(document.uri);
        if (!empty(cached)) {
          result.documentInfos.push(cached);
        } else {
          const documentInfo = await this.validateDocument_(
            document.uri,
            document.getText(),
            depth + 1,
          );

          // if document valid cache and push to result
          if (!empty(documentInfo)) {
            this.setDocumentInfo(document.uri, documentInfo);
            result.documentInfos.push(documentInfo);
          }
        }
      }
    }

    return result;
  }

  /**
   * Get all valid uris from the documents run statements
   * @param uri uri of the calling document
   * @param runStmts run statements in the document
   */
  private async loadDocuments(
    uri: string,
    runStmts: RunStmtType[],
  ): Promise<LoadedDocuments> {
    const documents: TextDocument[] = [];
    const diagnostics: Diagnostic[] = [];

    for (const runStmt of runStmts) {
      // attempt to get a resolvable path from a run statement
      const path = runPath(runStmt);
      if (typeof path === 'string') {
        // attempt to load document
        const document = await this.documentService.loadDocumentFromScript(
          runStmt.toLocation(uri),
          path,
        );

        if (!empty(document)) {
          // determine if document or diagnostic
          if (TextDocument.is(document)) {
            documents.push(document);
          } else {
            diagnostics.push(document);
          }
        }
        // was dynamically loaded path can't load
      } else {
        diagnostics.push(path);
      }
    }

    // generate uris then remove empty or preloaded documents
    return {
      documents,
      diagnostics,
    };
  }

  /**
   * Get the document info from the individual caches
   * @param uri document uri to check against
   */
  private getDocumentInfo(uri: string): Maybe<DocumentInfo> {
    // check cache for existing document info
    const lexicalInfo = this.lexicalCache.get(uri);
    const semanticInfo = this.semanticCache.get(uri);
    const otherDiagnostics = this.otherDiagnosticCache.get(uri);

    if (
      !empty(lexicalInfo) &&
      !empty(semanticInfo) &&
      !empty(otherDiagnostics)
    ) {
      return { lexicalInfo, semanticInfo, otherDiagnostics };
    }

    return undefined;
  }

  /**
   * Set all the individual caches for a document info
   * @param uri document uri to set
   * @param documentInfo document info to set
   */
  private setDocumentInfo(uri: string, documentInfo: DocumentInfo): void {
    // check cache for existing document info
    this.lexicalCache.set(uri, documentInfo.lexicalInfo);
    this.semanticCache.set(uri, documentInfo.semanticInfo);
    this.otherDiagnosticCache.set(uri, documentInfo.otherDiagnostics);
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
