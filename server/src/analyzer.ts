import { DiagnosticSeverity, Position } from 'vscode-languageserver';
import { IDocumentInfo, ILoadData, IDiagnosticUri, IValidateResult } from './types';
import { performance } from 'perf_hooks';
import { Parser } from './parser/parser';
import { ScopeManager } from './analysis/scopeManager';
import { FuncResolver } from './analysis/functionResolver';
import { Scanner } from './scanner/scanner';
import { Resolver } from './analysis/resolver';
import { IScannerError } from './scanner/types';
import { IParseError, SyntaxTreeResult, RunInstType } from './parser/types';
import { IResolverError, KsEntity } from './analysis/types';
import { mockLogger, mockTracer } from './utilities/logger';
import { IToken } from './entities/types';
import { empty, notEmpty } from './utilities/typeGuards';
import { SyntaxTreeFind } from './parser/syntaxTreeFind';
import { KsFunction } from './entities/function';
import { InvalidInst } from './parser/inst';
import { signitureHelper } from './utilities/signitureHelper';
import { CallExpr } from './parser/expr';
import { resolveUri } from './utilities/pathResolver';
import { existsSync } from 'fs';
import { extname } from 'path';
import { flatten } from './utilities/arrayUtilities';
import { readFileAsync } from './utilities/fsUtilities';
import { standardLibrary } from './analysis/standardLibrary';

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

  // main validation code
  public async validateDocument(uri: string, text: string, depth: number = 0):
    Promise<IValidateResult> {
    const { syntaxTree, parseErrors, scanErrors, runInsts } = await this.parseDocument(uri, text);
    let validateResults: IValidateResult[] = [];

    // if any run instruction exist get uri then load
    if (runInsts.length > 0 && !empty(this.volumne0Uri)) {
      const loadDatas = this.getValidUri(uri, runInsts);

      validateResults = await Promise.all(loadDatas
        .map(loadData => this.loadAndValidateDocument(uri, loadData, depth)));
    }

    // flatten all child diagnostics
    const childDiagnostics = flatten(validateResults.map(result => result.diagnostics));

    // generate a scope manager for resolving
    const scopeManager = new ScopeManager(this.logger);

    // add child scopes
    for (const validateResult of validateResults) {
      if (!empty(validateResult.scopeManager)) {
        scopeManager.addScope(validateResult.scopeManager);
      }
    }

    // add standard library
    scopeManager.addScope(standardLibrary);

    // generate resolvers
    const funcResolver = new FuncResolver();
    const resolver = new Resolver();

    // resolve the rest of the script
    this.logger.log(`Function resolving ${uri}`);
    this.logger.log('');
    performance.mark('func-resolver-start');
    let resolverErrors = funcResolver.resolve(syntaxTree, scopeManager);
    performance.mark('func-resolver-end');

    // perform an initial function pass
    this.logger.log(`Resolving ${uri}`);
    this.logger.log('');

    performance.mark('resolver-start');
    resolverErrors = resolverErrors.concat(resolver.resolve(syntaxTree, scopeManager));
    performance.mark('resolver-end');

    performance.measure('func-resolver', 'func-resolver-start', 'func-resolver-end');
    performance.measure('resolver', 'resolver-start', 'resolver-end');

    if (resolverErrors.length > 0) {
      this.logger.warn(`Resolver encountered ${resolverErrors.length} Errors.`);
    }

    // generate all diagnostics
    const diagnostics = childDiagnostics.concat(
      scanErrors.map(error => scanToDiagnostics(error, uri)),
      parseErrors.length === 0 ? [] : parseErrors.map(error => error.inner.concat(error))
        .reduce((acc, current) => acc.concat(current))
        .map(error => parseToDiagnostics(error, uri)),
      resolverErrors
        .map(error => resolverToDiagnostics(error, uri)),
      );

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

    this.documentInfos.set(uri, {
      syntaxTree,
      diagnostics,
      scopeManager,
    });

    performance.clearMarks();
    performance.clearMeasures();

    return {
      diagnostics,
      scopeManager,
    };
  }

  // get a token at a position in a document
  public getTokenAtPosition(uri: string, pos: Position): Maybe<IToken> {
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)
      || empty(documentInfo.scopeManager)
      || empty(documentInfo.syntaxTree)) {
      return undefined;
    }

    const { scopeManager, syntaxTree } = documentInfo;
    const finder = new SyntaxTreeFind();
    const result = finder.find(syntaxTree, pos);

    if (empty(result)) {
      return undefined;
    }

    const { token } = result;
    const entity = scopeManager.entityAtPosition(pos, token.lexeme);
    if (empty(entity)) {
      return undefined;
    }

    return entity.name;
  }

  // get entities at position
  public getEntitiesAtPosition(uri: string, pos: Position): KsEntity[] {
    const documentInfo = this.documentInfos.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.scopeManager)) {
      return documentInfo.scopeManager.entitiesAtPosition(pos);
    }

    return [];
  }

  // get all file entities
  public getAllFileEntities(uri: string): KsEntity[] {
    const documentInfo = this.documentInfos.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.scopeManager)) {
      return documentInfo.scopeManager.allFileEntities();
    }

    return [];
  }

  // get function at position
  public getFunctionAtPosition(uri: string, pos: Position):
    Maybe<{func: KsFunction, index: number}> {
    // we need the document info to lookup a signiture
    const documentInfo = this.documentInfos.get(uri);
    if (empty(documentInfo)) return undefined;

    const { syntaxTree } = documentInfo;
    const finder = new SyntaxTreeFind();

    // attempt to find a token here get surround invalid inst context
    const result = finder.find(syntaxTree, pos, InvalidInst);

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
      const ksFunction = documentInfo.scopeManager.entityAtPosition(pos, identifier);
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
  private async loadAndValidateDocument(
    parentUri: string,
    { uri, inst, path }: ILoadData,
    depth: number): Promise<IValidateResult> {
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
      return await this.validateDocument(validated.uri, fileResult, depth + 1);
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
