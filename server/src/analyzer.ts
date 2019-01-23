import { DiagnosticSeverity, Position, Location } from 'vscode-languageserver';
import { IDocumentInfo, ILoadData, IDiagnosticUri, ValidateResult } from './types';
import { performance } from 'perf_hooks';
import { Parser } from './parser/parser';
import { FuncResolver } from './analysis/functionResolver';
import { Scanner } from './scanner/scanner';
import { Resolver } from './analysis/resolver';
import { IScannerError } from './scanner/types';
import { IParseError, SyntaxTreeResult, RunInstType } from './parser/types';
import { IResolverError, KsEntity, IKsEntityTracker } from './analysis/types';
import { mockLogger, mockTracer } from './utilities/logger';
import { empty, notEmpty } from './utilities/typeGuards';
import { SyntaxTreeFind } from './parser/syntaxTreeFind';
import { KsFunction } from './entities/function';
import { InvalidInst } from './parser/inst';
import { signitureHelper } from './utilities/signitureHelper';
import { CallExpr } from './parser/expr';
import { resolveUri } from './utilities/pathResolver';
import { existsSync } from 'fs';
import { extname } from 'path';
import { readFileAsync } from './utilities/fsUtilities';
import { standardLibrary } from './analysis/standardLibrary';
import { builtIn } from './utilities/constants';
import { IType } from './typeChecker/types/types';
import { ScopeBuilder } from './analysis/scopeBuilder';
import { ScopeManager } from './analysis/scopeManager';

export class Analyzer {
  public volumne0Path: string;
  public volumne0Uri: Maybe<string>;
  public readonly documentInfos: Map<string, IDocumentInfo>;
  public readonly logger: ILogger;
  public readonly tracer: ITracer;

  constructor(logger: ILogger = mockLogger, tracer: ITracer = mockTracer) {
    this.volumne0Path = process.cwd();
    this.volumne0Uri = undefined;
    this.logger = logger;
    this.tracer = tracer;
    this.documentInfos = new Map();
  }

  public async* validateDocument(uri: string, text: string, depth: number = 0):
    AsyncIterableIterator<IDiagnosticUri[]> {
    for await (const result of this.validateDocument_(uri, text, depth)) {
      if (Array.isArray(result)) {
        yield result;
      }
    }
  }

  // main validation code
  private async* validateDocument_(uri: string, text: string, depth: number):
    AsyncIterableIterator<ValidateResult> {
    const { syntaxTree, parseErrors, scanErrors, runInsts } = await this.parseDocument(uri, text);
    const scopeManagers: ScopeManager[] = [];

    yield scanErrors.map(scanError => scanToDiagnostics(scanError, uri));
    yield parseErrors.length === 0 ? [] : parseErrors.map(error => error.inner.concat(error))
      .reduce((acc, current) => acc.concat(current))
      .map(error => parseToDiagnostics(error, uri));

    // if any run instruction exist get uri then load
    if (runInsts.length > 0 && !empty(this.volumne0Uri)) {
      const loadDatas = this.getValidUri(uri, runInsts);

      // for each document run validate and yield any results
      for await (const validateResult of loadDatas
        .map(loadData => this.loadAndValidateDocument(uri, loadData, depth))) {

        for await (const result of validateResult) {
          if (Array.isArray(result)) {
            yield result;
          } else {
            scopeManagers.push(result);
          }
        }
      }
    }

    // generate a scope manager for resolving
    const scopeBuilder = new ScopeBuilder(this.logger);

    // add child scopes
    for (const scopeManager of scopeManagers) {
      scopeBuilder.addScope(scopeManager);
    }

    // add standard library
    scopeBuilder.addScope(standardLibrary);

    // generate resolvers
    const funcResolver = new FuncResolver();
    const resolver = new Resolver();

    // resolve the rest of the script
    this.logger.log(`Function resolving ${uri}`);
    this.logger.log('');
    performance.mark('func-resolver-start');
    const functionErrors = funcResolver.resolve(syntaxTree, scopeBuilder)
      .map(error => resolverToDiagnostics(error, uri));

    yield functionErrors;

    performance.mark('func-resolver-end');

    // perform an initial function pass
    this.logger.log(`Resolving ${uri}`);
    this.logger.log('');

    performance.mark('resolver-start');
    const resolverErrors = resolver.resolve(syntaxTree, scopeBuilder)
      .map(error => resolverToDiagnostics(error, uri));

    yield resolverErrors;
    performance.mark('resolver-end');

    performance.measure('func-resolver', 'func-resolver-start', 'func-resolver-end');
    performance.measure('resolver', 'resolver-start', 'resolver-end');

    if (resolverErrors.length > 0) {
      this.logger.warn(`Resolver encountered ${resolverErrors.length} Errors.`);
    }

    // log performance
    const [funcResolverMeasure] = performance.getEntriesByName('func-resolver');
    const [resolverMeasure] = performance.getEntriesByName('resolver');

    this.logger.log('');
    this.logger.log('-------- performance ---------');
    this.logger.log(`Function Resolver took ${funcResolverMeasure.duration} ms`);
    this.logger.log(`Resolver took ${resolverMeasure.duration} ms`);
    this.logger.log('------------------------------');

    // make sure to delete references so scope manager can be gc'ed
    const documentInfo = this.documentInfos.get(uri);
    if (!empty(documentInfo)) {
      documentInfo.scopeManager.removeSelf();
    }

    const scopeManager = scopeBuilder.build();

    this.documentInfos.set(uri, {
      syntaxTree,
      scopeManager,
    });

    performance.clearMarks();
    performance.clearMeasures();

    return scopeManager;
  }

  // get a token at a position in a document
  public getDeclarationLocation(pos: Position, uri: string): Maybe<Location> {
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)
      || empty(documentInfo.scopeManager)
      || empty(documentInfo.syntaxTree)) {
      return undefined;
    }

    // try to find an entity at the position
    const { scopeManager, syntaxTree } = documentInfo;
    const finder = new SyntaxTreeFind();
    const result = finder.find(syntaxTree, pos);

    if (empty(result)) {
      return undefined;
    }

    // check if entity exists
    const { token } = result;
    const entity = scopeManager.scopedEntity(pos, token.lexeme);
    if (empty(entity)) {
      return undefined;
    }

    // exit if undefiend
    if (entity.name.uri === builtIn) {
      return undefined;
    }

    return entity.name.location();
  }

  public getUsagesLocations(pos: Position, uri: string): Maybe<Location[]> {
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)
      || empty(documentInfo.scopeManager)
      || empty(documentInfo.syntaxTree)) {
      return undefined;
    }

    // try to find the entity at the position
    const { scopeManager, syntaxTree } = documentInfo;
    const finder = new SyntaxTreeFind();
    const result = finder.find(syntaxTree, pos);

    if (empty(result)) {
      return undefined;
    }

    // try to find the tracker at a given position
    const { token } = result;
    const tracker = scopeManager.scopedTracker(pos, token.lexeme);
    if (empty(tracker)) {
      return undefined;
    }

    return tracker.usages.map(usage => usage.loc)
      .concat(tracker.declared.entity.name.location())
      .filter(location => location.uri !== builtIn);
  }

  // get all global trackers
  public getGlobalTracker(name: string): Maybe<IKsEntityTracker<KsEntity>> {
    return standardLibrary.globalTracker(name);
  }

  // get all tracker at position
  public getType(pos: Position, name: string, uri?: string):
    Maybe<IType> {
    if (empty(uri)) {
      const tracker = this.getGlobalTracker(name);
      return tracker && tracker.declared.type;
    }

    const documentInfo = this.documentInfos.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.scopeManager)) {
      const tracker = documentInfo.scopeManager.scopedTracker(pos, name);
      return tracker && tracker.declared.type;
    }

    const tracker = this.getGlobalTracker(name);
    return tracker && tracker.declared.type;
  }

  // get entities at position
  public getScopedEntities(pos: Position, uri: string): KsEntity[] {
    const documentInfo = this.documentInfos.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.scopeManager)) {
      return documentInfo.scopeManager.scopedEntities(pos);
    }

    return [];
  }

  // get all file entities
  public getAllFileEntities(uri: string): KsEntity[] {
    const documentInfo = this.documentInfos.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.scopeManager)) {
      return documentInfo.scopeManager.fileEntities();
    }

    return [];
  }

  // get function at position
  public getFunctionAtPosition(pos: Position, uri: string):
    Maybe<{func: KsFunction, index: number}> {
    // we need the document info to lookup a signiture
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)) return undefined;

    const { syntaxTree } = documentInfo;
    const finder = new SyntaxTreeFind();

    // attempt to find a token here get surround invalid inst context
    const result = finder.find(syntaxTree, pos, InvalidInst, CallExpr);

    // currently we only support invalid instructions for signiture completion
    // we could possible support call expressions as well
    if (empty(result) || empty(result.node)) {
      return undefined;
    }

    // determine the identifier of the invalid instruction and parameter index
    const { node } = result;

    if (node instanceof InvalidInst) {
      const identifierIndex = signitureHelper(node.tokens, pos);
      if (empty(identifierIndex)) return undefined;

      const { identifier, index } = identifierIndex;

      // resolve the token to make sure it's actually a function
      const ksFunction = documentInfo.scopeManager.scopedEntity(pos, identifier);
      if (empty(ksFunction) || ksFunction.tag !== 'function') {
        return undefined;
      }

      return {
        index,
        func: ksFunction,
      };
    }

    if (node instanceof CallExpr) {
      // TODO figure out this case
    }

    return undefined;
  }

  // generate the ast from the document string
  private async parseDocument(uri: string, text: string): Promise<SyntaxTreeResult> {
    this.logger.log('');
    this.logger.log(`Scanning ${uri}`);
    this.logger.log('');

    performance.mark('scanner-start');
    const scanner = new Scanner();
    const { tokens, scanErrors } = scanner.scanTokens(text, uri);
    performance.mark('scanner-end');

    // if scanner found errors report those immediately
    if (scanErrors.length > 0) {
      this.logger.warn(`Scanning encountered ${scanErrors.length} Errors.`);
    }

    // parse scanned tokens
    this.logger.log(`Parsing ${uri}`);
    this.logger.log('');

    performance.mark('parser-start');
    const parser = new Parser();
    const result = parser.parse(tokens);
    performance.mark('parser-end');

    // log errors
    if (result.parseErrors.length > 0) {
      this.logger.warn(`Parser encountered ${result.parseErrors.length} Errors.`);
    }

    // log performance
    performance.measure('scanner', 'scanner-start', 'scanner-end');
    performance.measure('parser', 'parser-start', 'parser-end');

    const [scannerMeasure] = performance.getEntriesByName('scanner');
    const [parserMeasure] = performance.getEntriesByName('parser');

    performance.clearMarks();
    performance.clearMeasures();

    this.logger.log('');
    this.logger.log('-------- performance ---------');
    this.logger.log(`Scanner took ${scannerMeasure.duration} ms`);
    this.logger.log(`Parser took ${parserMeasure.duration} ms`);
    this.logger.log('------------------------------');

    return {
      scanErrors,
      ...result,
    };
  }

  // get usable file uri from run instructions
  private getValidUri(uri: string, runInsts: RunInstType[]): ILoadData[] {
    // if something went wrong and we didn't get the root uri
    const volumne0Uri = this.volumne0Uri;
    if (empty(volumne0Uri)) {
      return [];
    }

    // generate uris then remove empty or preloaded documents
    return runInsts
      .map(inst => resolveUri(this.volumne0Path, volumne0Uri, uri, inst))
      .filter(notEmpty)
      .filter(uriInsts => !this.documentInfos.has(uriInsts.uri));
  }

  // load an validate a file from disk
  private async* loadAndValidateDocument(
    parentUri: string,
    { uri, inst, path }: ILoadData,
    depth: number): AsyncIterableIterator<ValidateResult> {
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
          diagnostics: [{
            uri: parentUri,
            range: { start: inst.start, end: inst.end },
            severity: DiagnosticSeverity.Error,
            message: `Unable to find ${path}`,
          }],
        };
      }

      // attempt to read file from disk
      const fileResult = await readFileAsync(validated.path, 'utf-8');
      return await this.validateDocument_(validated.uri, fileResult, depth + 1);
    } catch (err) {
      // if we already checked for the file exists but failed anyways??
      return {
        diagnostics: [{
          uri: parentUri,
          range: { start: inst.start, end: inst.end },
          severity: DiagnosticSeverity.Error,
          message: `Unable to read ${path}`,
        }],
      };
    }
  }

  private tryFindDocument(path: string, uri: string): Maybe<{path: string, uri: string}> {
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

// convert scan error to diagnostic
const scanToDiagnostics = (error: IScannerError, uri: string): IDiagnosticUri => {
  return {
    uri,
    severity: DiagnosticSeverity.Error,
    range: { start: error.start, end: error.end },
    message: error.message,
    source: 'kos-language-server',
  };
};

// convert parse error to diagnostic
const parseToDiagnostics = (error: IParseError, uri: string): IDiagnosticUri => {
  return {
    uri,
    severity: DiagnosticSeverity.Error,
    range: { start: error.start, end: error.end },
    message: error.message,
    source: 'kos-language-server',
  };
};

// convert resolver error to diagnostic
const resolverToDiagnostics = (error: IResolverError, uri: string): IDiagnosticUri => {
  return {
    uri,
    severity: DiagnosticSeverity.Warning,
    range: { start: error.start, end: error.end },
    message: error.message,
    source: 'kos-language-server',
  };
};
