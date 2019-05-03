import {
  DiagnosticSeverity,
  Position,
  Location,
  Diagnostic,
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
import { standardLibrary, bodyLibrary } from './analysis/standardLibrary';
import { builtIn } from './utilities/constants';
import { SymbolTableBuilder } from './analysis/symbolTableBuilder';
import { SymbolTable } from './analysis/symbolTable';
import { TypeChecker } from './typeChecker/typeChecker';
import {
  ITypeResolvedSuffix,
  ITypeNode,
} from './typeChecker/types';
import { IToken } from './entities/types';
import { IType } from './typeChecker/types/types';
import { binarySearch, rangeContains } from './utilities/positionUtils';

export class Analyzer {
  public workspaceFolder?: string;
  public readonly pathResolver: PathResolver;
  public readonly documentInfos: Map<string, IDocumentInfo>;
  public readonly logger: ILogger;
  public readonly tracer: ITracer;
  public readonly observer: PerformanceObserver;

  constructor(logger: ILogger = mockLogger, tracer: ITracer = mockTracer) {
    this.pathResolver = new PathResolver();
    this.logger = logger;
    this.tracer = tracer;
    this.documentInfos = new Map();
    this.workspaceFolder = undefined;
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

  // main validation code
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

    yield scanDiagnostics;
    yield parserDiagnostics;

    // if any run instruction exist get uri then load
    if (script.runInsts.length > 0 && this.pathResolver.ready) {
      const loadDatas = this.getValidUri(uri, script.runInsts);

      // for each document run validate and yield any results
      for (const loadData of loadDatas) {
        for await (const result of this.loadAndValidateDocument(
          uri,
          loadData,
          depth,
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
    symbolTableBuilder.linkTable(standardLibrary);
    symbolTableBuilder.linkTable(this.activeBodyLibrary());

    // generate resolvers
    const funcResolver = new PreResolver(
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

    // resolve the rest of the script
    performance.mark('func-resolver-start');
    const functionDiagnostics = funcResolver
      .resolve()
      .map(error => addDiagnosticsUri(error, uri));

    yield functionDiagnostics;
    performance.mark('func-resolver-end');

    // perform an initial function pass
    performance.mark('resolver-start');
    const resolverDiagnostics = resolver
      .resolve()
      .map(error => addDiagnosticsUri(error, uri));

    yield resolverDiagnostics;
    performance.mark('resolver-end');

    const symbolTable = symbolTableBuilder.build();
    const typeChecker = new TypeChecker(
      script,
      symbolTable,
      this.logger,
      this.tracer,
    );

    performance.mark('type-checking-start');

    typeChecker.check().map(error => addDiagnosticsUri(error, uri));

    // yield typeDiagnostics;
    performance.mark('type-checking-end');

    // measure performance
    performance.measure(
      'Function Resolver',
      'func-resolver-start',
      'func-resolver-end',
    );
    performance.measure('Resolver', 'resolver-start', 'resolver-end');
    performance.measure(
      'Type Checking',
      'type-checking-start',
      'type-checking-end',
    );

    // make sure to delete references so scope manager can be gc'ed
    const documentInfo = this.documentInfos.get(uri);
    if (!empty(documentInfo)) {
      documentInfo.symbolsTable.removeSelf();
    }

    this.documentInfos.set(uri, {
      script,
      symbolsTable: symbolTable,
      diagnostics: scanDiagnostics.concat(
        parserDiagnostics,
        functionDiagnostics,
        resolverDiagnostics,
        // typeDiagnostics,
      ),
    });

    this.logger.info('--------------------------------------');
    performance.clearMarks();

    yield symbolTable;
  }

  private activeBodyLibrary(): SymbolTable {
    return bodyLibrary;
  }

  public getSuffixType(
    pos: Position,
    uri: string,
  ): Maybe<[IType, KsSymbolKind]> {
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)) {
      return undefined;
    }

    // try to find an symbol at the position
    const { script, symbolsTable } = documentInfo;
    const finder = new ScriptFind();
    const result = finder.find(
      script,
      pos,
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
      const checker = new TypeChecker(script, symbolsTable);
      const result = checker.checkSuffix(node);

      if (rangeContains(result.resolved.atom, pos)) {
        return [result.resolved.atom.type, result.resolved.atomType];
      }

      const suffixNodes = this.resolvedNodes(result.resolved);
      const suffixNode = binarySearch(suffixNodes, pos);

      if (suffixNode) {
        return [suffixNode.type, KsSymbolKind.suffix];
      }
    }

    const tracker = symbolsTable.scopedNamedTracker(pos, token.lookup);

    if (!empty(tracker)) {
      return [tracker.declared.type, tracker.declared.symbol.tag];
    }

    return undefined;
  }

  private resolvedNodes(resolved: ITypeResolvedSuffix<IType>): ITypeNode[] {
    const nodes = [resolved.atom, ...resolved.termTrailers];
    return empty(resolved.suffixTrailer)
      ? nodes
      : nodes.concat(this.resolvedNodes(resolved.suffixTrailer));
  }

  // get the token at a position
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

  // get a token at a position in a document
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

  public getUsagesLocations(pos: Position, uri: string): Maybe<Location[]> {
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

  // get a scoped trackers
  public getScopedTracker(
    pos: Position,
    name: string,
    uri?: string,
  ): Maybe<IKsSymbolTracker<KsSymbol>> {
    if (empty(uri)) {
      const trackers = this.getGlobalTrackers(name);
      return trackers.length === 1 ? trackers[0] : undefined;
    }

    const documentInfo = this.documentInfos.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.symbolsTable)) {
      return documentInfo.symbolsTable.scopedNamedTracker(pos, name);
    }

    const trackers = this.getGlobalTrackers(name);
    return trackers.length === 1 ? trackers[0] : undefined;
  }

  // get a global trackers
  public getGlobalTrackers(name: string): IKsSymbolTracker<KsSymbol>[] {
    return standardLibrary.globalTrackers(name);
  }

  // get all tracker at position
  public getType(pos: Position, name: string, uri?: string): Maybe<IType> {
    const tracker = this.getScopedTracker(pos, name, uri);
    return tracker && tracker.declared.type;
  }

  // get symbols at position
  public getScopedSymbols(pos: Position, uri: string): KsSymbol[] {
    const documentInfo = this.documentInfos.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.symbolsTable)) {
      return documentInfo.symbolsTable.scopedSymbols(pos);
    }

    return [];
  }

  // get all file symbols
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

  // generate the ast from the document string
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
