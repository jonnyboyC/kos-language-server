import {
  DiagnosticUri,
  IDocumentInfo,
  LoadedDocuments,
  ValidateResult2,
} from '../types';
import { SymbolTable } from '../analysis/symbolTable';
import { ScriptResult, RunStmtType } from '../parser/types';
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
  private readonly documentInfos: Map<string, IDocumentInfo>;

  /**
   * The current loaded standard library
   */
  private standardLibrary: SymbolTable;

  /**
   * The current loaded celetrial body library
   */
  private bodyLibrary: SymbolTable;

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
      this.logger.verbose('');
      this.logger.verbose('-------- Performance ---------');
      for (const entry of list.getEntries()) {
        this.logger.verbose(`${entry.name} took ${entry.duration} ms`);
      }
      this.logger.verbose('------------------------------');
    });
    this.observer.observe({ entryTypes: ['measure'], buffered: true });
  }

  /**
   * Validate a document in asynchronous stages. This produces diagnostics about known errors or
   * potential problems in the provided script
   * @param uri uri of the document
   * @param text source text of the document
   * @param depth TODO remove: current depth of the document
   */
  public async validateDocument(
    uri: string,
    text: string,
    depth: number = 0,
  ): Promise<DiagnosticUri[]> {
    try {
      const result = await this.validateDocument_(uri, text, depth);
      return result.diagnostics;
    } catch (err) {
      logException(this.logger, this.tracer, err, LogLevel.error);
      return [];
    }
  }

  /**
   * Get a document info if it exists
   */
  public getInfo(uri: string): Maybe<IDocumentInfo> {
    return this.documentInfos.get(uri);
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
  ): Promise<ValidateResult2> {
    if (depth > 10) {
      return { diagnostics: [], tables: [] };
    }

    const {
      script,
      regions,
      parseErrors,
      scanErrors,
    } = await this.parseDocument(uri, text);

    const validationResult: ValidateResult2 = {
      tables: [],
      diagnostics: [],
    };

    validationResult.diagnostics.push(
      ...scanErrors.map(scanError => addDiagnosticsUri(scanError, uri)),
    );
    const parserDiagnostics =
      parseErrors.length === 0
        ? []
        : parseErrors
            .map(error => error.inner.concat(error))
            .reduce((acc, current) => acc.concat(current))
            .map(error => parseToDiagnostics(error, uri));

    validationResult.diagnostics.push(...parserDiagnostics);

    // if any run statement exist get uri then load
    if (script.runStmts.length > 0 && this.documentService.ready) {
      const { documents, diagnostics } = await this.loadDocuments(
        uri,
        script.runStmts,
      );

      validationResult.diagnostics.push(
        ...diagnostics.map(error => addDiagnosticsUri(error, uri)),
      );

      // for each document run validate and yield any results
      for (const document of documents) {
        const cached = this.documentInfos.get(document.uri);
        if (!empty(cached)) {
          validationResult.diagnostics.push(...cached.diagnostics);

          // TODO
          validationResult.tables.push(cached.symbolTable);
        } else {
          const { diagnostics, tables } = await this.validateDocument_(
            document.uri,
            document.getText(),
            depth + 1,
          );

          validationResult.diagnostics.push(...diagnostics);
          validationResult.tables.push(...tables);
        }
      }
    }

    this.logger.verbose('');
    this.logger.verbose('-------------Semantic Analysis------------');

    // generate a scope manager for resolving
    const symbolTableBuilder = new SymbolTableBuilder(uri, this.logger);

    // add child scopes
    for (const symbolTable of validationResult.tables) {
      symbolTableBuilder.linkDependency(symbolTable);
    }

    // add standard library
    symbolTableBuilder.linkDependency(this.activeStandardLibrary());
    symbolTableBuilder.linkDependency(this.activeBodyLibrary());

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

    validationResult.diagnostics.push(...preDiagnostics);
    performance.mark('pre-resolver-end');

    // traverse the ast again to resolve the remaning symbols
    performance.mark('resolver-start');
    const resolverDiagnostics = resolver
      .resolve()
      .map(error => addDiagnosticsUri(error, uri));

    validationResult.diagnostics.push(...resolverDiagnostics);

    // find scopes were symbols were never used
    const unusedDiagnostics = symbolTableBuilder
      .findUnused()
      .map(error => addDiagnosticsUri(error, uri));

    validationResult.diagnostics.push(...unusedDiagnostics);
    performance.mark('resolver-end');

    const oldDocumentInfo = this.documentInfos.get(uri);

    // build the final symbol table
    const symbolTable = symbolTableBuilder.build(
      oldDocumentInfo && oldDocumentInfo.symbolTable,
    );

    // perform type checking
    const typeChecker = new TypeChecker(script, this.logger, this.tracer);

    performance.mark('type-checking-start');

    const typeDiagnostics = typeChecker
      .check()
      .map(error => addDiagnosticsUri(error, uri));

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
      documentInfo.symbolTable.removeSelf();
      documentInfo = undefined;
    }

    this.documentInfos.set(uri, {
      script,
      regions,
      symbolTable,
      diagnostics: validationResult.diagnostics.concat(typeDiagnostics),
    });

    this.logger.verbose('--------------------------------------');
    performance.clearMarks();

    validationResult.tables.push(symbolTable);
    return validationResult;
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
    const result = parser.parse();
    performance.mark('parser-end');

    // measure performance
    performance.measure('Scanner', 'scanner-start', 'scanner-end');
    performance.measure('Parser', 'parser-start', 'parser-end');
    performance.clearMarks();

    this.logger.verbose('--------------------------------------');

    return {
      scanErrors,
      regions,
      ...result,
    };
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
        const document = await this.documentService.loadDocument(
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
    /** TODO actually load other bodies */
    return this.bodyLibrary;
  }
}
