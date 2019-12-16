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
import {
  directiveParser,
  DirectiveResult,
} from '../../src/directives/directiveParser';

const fakeUri = 'C:\\fake.ks';

export interface IResolveResults {
  scan: Tokenized;
  parse: Ast;
  directives: DirectiveResult;
  table: SymbolTable;
  resolveDiagnostics: Diagnostic[];
}

export const scanSource = (
  source: string,
  uri: string = fakeUri,
): Tokenized => {
  const scanner = new Scanner(source, uri);
  return scanner.scanTokens();
};

// parse source
export const parseSource = (
  source: string,
  uri: string = fakeUri,
): Pick<IResolveResults, 'scan' | 'parse' | 'directives'> => {
  const scanner = new Scanner(source, uri);
  const scan = scanner.scanTokens();

  const parser = new Parser(uri, scan.tokens);
  const parse = parser.parse();

  const directives = directiveParser(scan.directiveTokens);

  return { scan, parse, directives };
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
  expect(result.scan.diagnostics.map(e => e.message)).toEqual([]);
  expect(result.parse.diagnostics.map(e => e.message)).toEqual([]);
};

export const noResolverErrors = (result: IResolveResults): void => {
  expect(result.scan.diagnostics.map(e => e.message)).toEqual([]);
  expect(result.parse.diagnostics.map(e => e.message)).toEqual([]);
  expect(result.resolveDiagnostics.map(e => e.message)).toEqual([]);
};
