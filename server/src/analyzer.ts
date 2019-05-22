import {
  DiagnosticSeverity,
  Position,
  Location,
  Diagnostic,
  Range,
} from 'vscode-languageserver';
import {
  IDocumentInfo,
  ILoadData,
  IDiagnosticUri,
  ValidateResult,
} from './types';
import { performance, PerformanceObserver } from 'perf_hooks';
import { Parser } from './parser/parser';
import { PreResolver } from './analysis/preResolver';
import { Scanner } from './scanner/scanner';
import { Resolver } from './analysis/resolver';
import { IParseError, ScriptResult, RunInstType } from './parser/types';
import { KsSymbol, IKsSymbolTracker, KsSymbolKind } from './analysis/types';
import { mockLogger, mockTracer } from './utilities/logger';
import { empty, notEmpty } from './utilities/typeGuards';
import { ScriptFind } from './parser/scriptFind';
import { KsFunction } from './entities/function';
import * as Inst from './parser/inst';
import { signitureHelper } from './utilities/signitureUtils';
import * as Expr from './parser/expr';
import * as SuffixTerm from './parser/suffixTerm';
import * as Decl from './parser/declare';
import { PathResolver, runPath } from './utilities/pathResolver';
import { existsSync } from 'fs';
import { extname } from 'path';
import { readFileAsync } from './utilities/fsUtils';
import {
  standardLibraryBuilder,
  bodyLibraryBuilder,
} from './analysis/standardLibrary';
import { builtIn } from './utilities/constants';
import { SymbolTableBuilder } from './analysis/symbolTableBuilder';
import { SymbolTable } from './analysis/symbolTable';
import { TypeChecker } from './typeChecker/typeChecker';
import { ITypeResolvedSuffix, ITypeNode } from './typeChecker/types';
import { IToken } from './entities/types';
import { IType } from './typeChecker/types/types';
import { binarySearch, rangeContainsPos } from './utilities/positionUtils';

export class Analyzer {
  public workspaceFolder?: string;

  private standardLibrary: SymbolTable;
  private bodyLibrary: SymbolTable;

  public readonly pathResolver: PathResolver;
  public readonly documentInfos: Map<string, IDocumentInfo>;
  public readonly logger: ILogger;
  public readonly tracer: ITracer;
  public readonly observer: PerformanceObserver;

  constructor(
    caseKind: CaseKind = CaseKind.camelcase,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
  ) {
    this.pathResolver = new PathResolver();
    this.logger = logger;
    this.tracer = tracer;
    this.documentInfos = new Map();
    this.workspaceFolder = undefined;

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
   * Set the volume 0 path for the analyzer
   * @param path path of volume 0
   */
  public setPath(path: string): void {
    this.pathResolver.volume0Path = path;
    this.workspaceFolder = path;
  }

  /**
   * Set the volume 0 uri for the analyzer
   * @param uri uri to volume 0
   */
  public setUri(uri: string): void {
    this.pathResolver.volume0Uri = uri;
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

    // if any run instruction exist get uri then load
    if (script.runInsts.length > 0 && this.pathResolver.ready) {
      const loadDatas = this.getValidUri(uri, script.runInsts);

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
    const typeChecker = new TypeChecker(
      script,
      this.logger,
      this.tracer,
    );

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
   * Get the symbol table corresponding active set of celetrial bodies for the user.
   * This allows for bodies other than that in stock ksp to be incorporated
   */
  private activeBodyLibrary(): SymbolTable {
    /** TODO actually load other bodies */
    return this.bodyLibrary;
  }

  /**
   * Get the type of a suffix at a particular location in a script
   * @param pos position to inspect
   * @param uri uri of the document
   */
  public getSuffixType(
    pos: Position,
    uri: string,
  ): Maybe<[IType, KsSymbolKind]> {
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)) {
      return undefined;
    }

    // try to find an symbol at the position
    const { script } = documentInfo;
    const finder = new ScriptFind();
    const result = finder.find(
      script,
      pos,
      Inst.Invalid,
      Expr.Suffix,
      Decl.Var,
      Decl.Lock,
      Decl.Func,
      Decl.Parameter,
    );

    if (empty(result)) {
      return undefined;
    }

    const { node, token } = result;
    if (empty(node)) {
      return undefined;
    }

    if (node instanceof Expr.Suffix) {
      const checker = new TypeChecker(script);
      const result = checker.checkSuffix(node);

      if (rangeContainsPos(result.resolved.atom, pos)) {
        return [result.resolved.atom.type, result.resolved.atomType];
      }

      const suffixNodes = this.resolvedNodes(result.resolved);
      const suffixNode = binarySearch(suffixNodes, pos);

      if (suffixNode) {
        return [suffixNode.type, KsSymbolKind.suffix];
      }
    }

    if (node instanceof Inst.Invalid) {
      console.log();
    }

    const { tracker } = token;
    if (!empty(tracker)) {
      return [tracker.declared.type, tracker.declared.symbol.tag];
    }

    return undefined;
  }

  /**
   * Gets an array of nodes corresponding to a suffix type checking. This
   * method will be removed when the type checker is updated
   */
  private resolvedNodes(resolved: ITypeResolvedSuffix<IType>): ITypeNode[] {
    const nodes = [resolved.atom, ...resolved.termTrailers];
    return empty(resolved.suffixTrailer)
      ? nodes
      : nodes.concat(this.resolvedNodes(resolved.suffixTrailer));
  }

  /**
   * Get the token at the provided position in the text document
   * @param pos position in the text document
   * @param uri uri of the text document
   */
  public getToken(pos: Position, uri: string): Maybe<IToken> {
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
    const { symbolsTable, script } = documentInfo;
    const finder = new ScriptFind();
    const result = finder.find(script, pos);

    if (empty(result)) {
      return undefined;
    }

    // check if symbols exists
    const { token } = result;
    const symbol = symbolsTable.scopedNamedTracker(pos, token.lookup);
    if (empty(symbol)) {
      return undefined;
    }

    // exit if undefiend
    if (symbol.declared.uri === builtIn) {
      return undefined;
    }

    return symbol.declared.symbol.name;
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

    return locations
      .filter(loc => loc.uri === uri)
      .map(loc => loc.range);
  }

  /**
   * Get all symbols in scope at a particulare location in the file
   * @param pos position in document
   * @param uri document uri
   */
  public getScopedSymbols(pos: Position, uri: string): KsSymbol[] {
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

  // get function at position
  public getFunctionAtPosition(
    pos: Position,
    uri: string,
  ): Maybe<{ func: KsFunction; index: number }> {
    // we need the document info to lookup a signiture
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)) return undefined;

    const { script } = documentInfo;
    const finder = new ScriptFind();

    // attempt to find a token here get surround invalid inst context
    const result = finder.find(
      script,
      pos,
      Inst.Invalid,
      Expr.Invalid,
      SuffixTerm.Call,
    );

    // currently we only support invalid instructions for signiture completion
    // we could possible support call expressions as well
    if (empty(result) || empty(result.node)) {
      return undefined;
    }

    // determine the identifier of the invalid instruction and parameter index
    const { node } = result;

    if (node instanceof Inst.Invalid) {
      const identifierIndex = signitureHelper(node.tokens, pos);
      if (empty(identifierIndex)) return undefined;

      const { identifier, index } = identifierIndex;

      // resolve the token to make sure it's actually a function
      const ksFunction = documentInfo.symbolsTable.scopedFunctionTracker(
        pos,
        identifier,
      );
      if (empty(ksFunction)) {
        return undefined;
      }

      return {
        index,
        func: ksFunction.declared.symbol,
      };
    }

    if (node instanceof SuffixTerm.Call) {
      // TODO figure out this case
    }

    if (node instanceof Expr.Invalid) {
      // TODO figure out this case
    }

    return undefined;
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

  // get usable file uri from run instructions
  private getValidUri(uri: string, runInsts: RunInstType[]): ILoadData[] {
    // generate uris then remove empty or preloaded documents
    return runInsts
      .map(inst =>
        this.pathResolver.resolveUri(
          {
            uri,
            range: { start: inst.start, end: inst.end },
          },
          runPath(inst),
        ),
      )
      .filter(notEmpty);
    // .filter(uriInsts => !this.documentInfos.has(uriInsts.uri));
  }

  // load an validate a file from disk
  private async *loadAndValidateDocument(
    parentUri: string,
    { uri, caller, path }: ILoadData,
    depth: number,
  ): AsyncIterableIterator<ValidateResult> {
    try {
      // non ideal fix for depedency cycle
      // TODO we need to actually check for cycles and do something else
      if (depth > 10) {
        return { diagnostics: [] };
      }

      // if cache not found attempt to find file from disk
      const validated = this.tryFindDocument(path, uri);
      if (empty(validated)) {
        return {
          diagnostics: [
            {
              uri: parentUri,
              range: caller,
              severity: DiagnosticSeverity.Error,
              message: `Unable to find ${path}`,
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
            message: `Unable to read ${path}`,
          },
        ],
      };
    }
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
