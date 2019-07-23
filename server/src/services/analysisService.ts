import {
  DiagnosticUri,
  IDocumentInfo as DocumentInfo,
  LoadedDocuments,
} from '../types';
import { SymbolTable } from '../analysis/symbolTable';
import {
  LexicalResult,
  RunStmtType,
  IScript,
  SemanticResult,
} from '../parser/types';
import { SymbolTableBuilder } from '../analysis/symbolTableBuilder';
import { PreResolver } from '../analysis/preResolver';
import { performance, PerformanceObserver } from 'perf_hooks';
import { TypeChecker } from '../typeChecker/typeChecker';
import { empty } from '../utilities/typeGuards';
import { Scanner } from '../scanner/scanner';
import { Parser } from '../parser/parser';
import { TextDocument, Diagnostic } from 'vscode-languageserver';
import {
  addDiagnosticsUri,
  parseToDiagnostics,
} from '../utilities/serverUtils';
import { DocumentService } from './documentService';
import { logException } from '../utilities/logger';
import { Resolver } from '../analysis/resolver';
import { runPath } from '../utilities/pathResolver';
import {
  standardLibraryBuilder,
  bodyLibraryBuilder,
} from '../analysis/standardLibrary';

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
   * Document information
   */
  private readonly documentInfos: Map<string, DocumentInfo>;

  /**
   * The current loaded standard library
   */
  private standardLibrary: SymbolTable;

  /**
   * The current loaded celestial body library
   */
  private bodyLibrary: SymbolTable;

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

    this.documentInfos = new Map();

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
      const result = await this.validateDocument_(uri, text, 0);
      if (!empty(result)) {
        this.documentInfos.set(uri, result);
      }

      return empty(result) ? [] : result.diagnostics;
    } catch (err) {
      logException(this.logger, this.tracer, err, LogLevel.error);
      return [];
    }
  }

  /**
   * Get a document info if it exists
   */
  public async getInfo(uri: string): Promise<Maybe<DocumentInfo>> {
    // if we already have the document loaded return it
    const documentInfo = this.documentInfos.get(uri);
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
        this.documentInfos.set(uri, result);
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
    this.standardLibrary = standardLibraryBuilder(caseKind);
    this.bodyLibrary = bodyLibraryBuilder(caseKind);
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
    const {
      script,
      regions,
      scannerDiagnostics,
      parserDiagnostics,
    } = this.lexicalAnalysisDocument(uri, text);

    // load dependencies found in the ast
    const { documentInfos, loadDiagnostics } = await this.loadDependencies(
      uri,
      script,
      depth,
    );

    // add standard library to dependencies
    const dependencyTables: Set<SymbolTable> = new Set([
      this.activeStandardLibrary(),
      this.activeBodyLibrary(),
    ]);

    // add run statement dependencies and their dependencies
    for (const documentInfo of documentInfos) {
      dependencyTables.add(documentInfo.symbolTable);
    }

    // perform semantic analysis
    const {
      resolverDiagnostics,
      typeDiagnostics,
      symbolTable,
    } = this.semanticAnalysisDocument(uri, script, dependencyTables);

    // clear performance observer marks
    performance.clearMarks();

    // generate the document info
    return {
      script,
      regions,
      symbolTable,
      diagnostics: [
        ...scannerDiagnostics,
        ...parserDiagnostics,
        ...loadDiagnostics,
        ...resolverDiagnostics,
        ...typeDiagnostics,
      ],
    };
  }

  /**
   * Perform lexical analysis on the provided provided source text
   * @param uri uri to document
   * @param text source text of document
   */
  private lexicalAnalysisDocument(uri: string, text: string): LexicalResult {
    this.logger.verbose('');
    this.logger.verbose('-------------Lexical Analysis------------');

    performance.mark('scanner-start');
    const scanner = new Scanner(text, uri, this.logger, this.tracer);
    const { tokens, scanErrors, regions } = scanner.scanTokens();
    performance.mark('scanner-end');

    // if scanner found errors report those immediately
    if (scanErrors.length > 0) {
      this.logger.warn(`Scanning encountered ${scanErrors.length} Errors.`);
    }

    performance.mark('parser-start');
    const parser = new Parser(uri, tokens, this.logger, this.tracer);
    const { script, parseErrors } = parser.parse();
    performance.mark('parser-end');

    // measure performance
    performance.measure('Scanner', 'scanner-start', 'scanner-end');
    performance.measure('Parser', 'parser-start', 'parser-end');
    performance.clearMarks();

    this.logger.verbose('--------------------------------------');

    // generate lexical diagnostics
    const scannerDiagnostics = scanErrors.map(scanError =>
      addDiagnosticsUri(scanError, uri),
    );
    const parserDiagnostics =
      parseErrors.length === 0
        ? []
        : parseErrors
            .map(error => error.inner.concat(error))
            .reduce((acc, current) => acc.concat(current))
            .map(error => parseToDiagnostics(error, uri));

    return {
      scannerDiagnostics,
      parserDiagnostics,
      script,
      regions,
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
  ): SemanticResult {
    this.logger.verbose('');
    this.logger.verbose('-------------Semantic Analysis------------');

    // generate a scope manager for resolving
    const symbolTableBuilder = new SymbolTableBuilder(uri, this.logger);
    let oldDocumentInfo = this.documentInfos.get(uri);

    // add symbol tables that are dependent
    if (!empty(oldDocumentInfo)) {
      for (const dependent of oldDocumentInfo.symbolTable.dependentTables) {
        symbolTableBuilder.linkDependent(dependent);
      }

      oldDocumentInfo.symbolTable.removeSelf();
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
    if (!empty(oldDocumentInfo)) {
      oldDocumentInfo.symbolTable.removeSelf();
      oldDocumentInfo = undefined;
    }

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
      'Type Checking',
      'type-checking-start',
      'type-checking-end',
    );

    this.logger.verbose('--------------------------------------');

    return {
      symbolTable,
      typeDiagnostics,
      resolverDiagnostics,
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
        const cached = this.documentInfos.get(document.uri);
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
            this.documentInfos.set(document.uri, documentInfo);
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
