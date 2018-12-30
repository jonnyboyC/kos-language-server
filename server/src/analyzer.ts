import { DiagnosticSeverity, Position } from 'vscode-languageserver';
import { IDocumentInfo, ILoadData, DiagnosticUri } from './types';
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
import { empty } from './utilities/typeGuards';
import { SyntaxTreeFind } from './parser/syntaxTreeFind';
import { KsFunction } from './entities/function';
import { InvalidInst } from './parser/inst';
import { signitureHelper } from './utilities/signitureHelper';
import { CallExpr } from './parser/expr';
import { resolveUri } from './utilities/pathResolver';
import { existsSync } from 'fs';
import { flatten } from './utilities/arrayUtilities';
import { readFileAsync } from './utilities/fsUtilities';

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
  public async validateDocument(uri: string, text: string): Promise<DiagnosticUri[]> {
    const { syntaxTree, parseErrors, scanErrors, runInsts } = await this.parseDocument(uri, text);
    let diagnostics: DiagnosticUri[] = [];

    // if any run instruction exist get uri then load
    if (runInsts.length > 0 && !empty(this.volumne0Uri)) {
      const loadDatas = this.getValidUri(uri, runInsts);

      diagnostics = flatten(await Promise.all(loadDatas
        .map(loadData => this.loadAndValidateDocument(loadData))),
      );
    }

    // generate a scope manager for resolving
    const scopeMan = new ScopeManager(this.logger);

    // generate resolvers
    const funcResolver = new FuncResolver();
    const resolver = new Resolver();

    // resolve the rest of the script
    this.logger.log(`Function resolving ${uri}`);
    this.logger.log('');
    performance.mark('func-resolver-start');
    let resolverErrors = funcResolver.resolve(syntaxTree, scopeMan);
    performance.mark('func-resolver-end');

    // perform an initial function pass
    this.logger.log(`Resolving ${uri}`);
    this.logger.log('');

    performance.mark('resolver-start');
    resolverErrors = resolverErrors.concat(resolver.resolve(syntaxTree, scopeMan));
    performance.mark('resolver-end');

    performance.measure('func-resolver', 'func-resolver-start', 'func-resolver-end');
    performance.measure('resolver', 'resolver-start', 'resolver-end');

    if (resolverErrors.length > 0) {
      this.logger.warn(`Resolver encountered ${resolverErrors.length} Errors.`);
    }

    // generate all diagnostics
    diagnostics = diagnostics.concat(scanErrors.map(error => scanToDiagnostics(error, uri)).concat(
      parseErrors.length === 0 ? [] : parseErrors.map(error => error.inner.concat(error))
        .reduce((acc, current) => acc.concat(current))
        .map(error => parseToDiagnostics(error, uri)),
      resolverErrors
        .map(error => resolverToDiagnostics(error, uri)),
      ));

    // log performance
    const [funcResolverMeasure] = performance.getEntriesByName('func-resolver');
    const [resolverMeasure] = performance.getEntriesByName('resolver');

    this.logger.log('');
    this.logger.log('-------- performance ---------');
    this.logger.log(`Function Resolver took ${funcResolverMeasure.duration} ms`);
    this.logger.log(`Resolver took ${resolverMeasure.duration} ms`);

    this.documentInfos.set(uri, {
      syntaxTree,
      scopeManager: scopeMan,
    });

    performance.clearMarks();
    performance.clearMeasures();

    return diagnostics;
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
    const { tokens, scanErrors } = scanner.scanTokens(text);
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

    // get uri data
    const uriInsts = runInsts
      .map((inst) => {

        // resolve uri from instruction and root info
        const result = resolveUri(this.volumne0Path, volumne0Uri, uri, inst);
        if (empty(result)) {
          return { inst, uri: undefined, path: undefined };
        }

        return { inst, ...result };
      });

    // filter out data that does not have a path and uri
    const filteredUri: ILoadData[] = [];
    for (const uriInst of uriInsts) {
      const { uri, inst, path } = uriInst;

      if (!empty(uri) && !empty(path)) {
        filteredUri.push({ uri, inst, path });
      }
    }

    // filter out documents that have already been loaded
    return filteredUri.filter(uriInsts => !this.documentInfos.has(uriInsts.uri));
  }

  // load an validate a file from disk
  private async loadAndValidateDocument({ uri, inst, path }: ILoadData): Promise<DiagnosticUri[]> {
    try {
      if (!existsSync(path)) {
        return [{
          uri,
          range: inst,
          severity: DiagnosticSeverity.Error,
          message: `Unable to find ${uri}`,
        }];
      }

      // attempt to read file from disk
      const fileResult = await readFileAsync(path, 'utf-8');
      return await this.validateDocument(uri, fileResult);
    } catch (err) {

      // if we already checked for the file and failed ??
      return [{
        uri,
        range: inst,
        severity: DiagnosticSeverity.Error,
        message: `Unable to read ${uri}`,
      }];
    }
  }
}

// convert scan error to diagnostic
const scanToDiagnostics = (error: IScannerError, uri: string): DiagnosticUri => {
  return {
    uri,
    severity: DiagnosticSeverity.Error,
    range: { start: error.start, end: error.end },
    message: error.message,
    source: 'kos-language-server',
  };
};

// convert parse error to diagnostic
const parseToDiagnostics = (error: IParseError, uri: string): DiagnosticUri => {
  return {
    uri,
    severity: DiagnosticSeverity.Error,
    range: { start: error.token.start, end: error.token.end },
    message: error.message,
    source: 'kos-language-server',
  };
};

// convert resolver error to diagnostic
const resolverToDiagnostics = (error: IResolverError, uri: string): DiagnosticUri => {
  return {
    uri,
    severity: DiagnosticSeverity.Warning,
    range: { start: error.token.start, end: error.token.end },
    message: error.message,
    source: 'kos-language-server',
  };
};
