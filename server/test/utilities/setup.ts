import { Tokenized } from '../../src/scanner/types';
import { Ast } from '../../src/parser/types';
import { SymbolTable } from '../../src/analysis/models/symbolTable';
import { Diagnostic } from 'vscode-languageserver';
import { Scanner } from '../../src/scanner/scanner';
import { Parser } from '../../src/parser/parser';
import { SymbolTableBuilder } from '../../src/analysis/models/symbolTableBuilder';
import { standardLibraryBuilder } from '../../src/analysis/standardLibrary';
import { PreResolver } from '../../src/analysis/preResolver';
import { Resolver } from '../../src/analysis/resolver';

const fakeUri = 'C:\\fake.ks';

export interface IResolveResults {
  scan: Tokenized;
  parse: Ast;
  table: SymbolTable;
  resolveDiagnostics: Diagnostic[];
}

// parse source
export const parseSource = (
  source: string,
  uri: string = fakeUri,
): Pick<IResolveResults, 'scan' | 'parse'> => {
  const scanner = new Scanner(source, uri);
  const scan = scanner.scanTokens();

  const parser = new Parser(uri, scan.tokens);
  const parse = parser.parse();

  return { scan, parse };
};

export const resolveSource = (
  source: string,
  uri: string = fakeUri,
  standardLib = false,
  ...otherTables: SymbolTable[]
): IResolveResults => {
  const result = parseSource(source, uri);

  const symbolTableBuilder = new SymbolTableBuilder(uri);

  if (standardLib) {
    symbolTableBuilder.linkDependency(
      standardLibraryBuilder(CaseKind.lowerCase),
    );
  }

  for (const table of otherTables) {
    symbolTableBuilder.linkDependency(table);
  }

  const functionResolver = new PreResolver(
    result.parse.script,
    symbolTableBuilder,
  );
  const resolver = new Resolver(result.parse.script, symbolTableBuilder);

  const preResolverError = functionResolver.resolve();
  const resolverErrors = resolver.resolve();
  const unusedErrors = symbolTableBuilder.findUnused();

  return {
    ...result,
    resolveDiagnostics: preResolverError.concat(resolverErrors, unusedErrors),
    table: symbolTableBuilder.build(),
  };
};

export const noParseErrors = (
  result: Pick<IResolveResults, 'scan' | 'parse'>,
): void => {
  expect(result.scan.scanDiagnostics.map(e => e.message)).toEqual([]);
  expect(result.parse.parseDiagnostics.map(e => e.message)).toEqual([]);
};

export const noResolverErrors = (result: IResolveResults): void => {
  expect(result.scan.scanDiagnostics.map(e => e.message)).toEqual([]);
  expect(result.parse.parseDiagnostics.map(e => e.message)).toEqual([]);
  expect(result.resolveDiagnostics.map(e => e.message)).toEqual([]);
};
