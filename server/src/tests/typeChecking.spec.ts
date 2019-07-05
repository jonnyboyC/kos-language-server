import { IScanResult } from '../scanner/types';
import { IParseResult } from '../parser/types';
import { SymbolTable } from '../analysis/symbolTable';
import { Diagnostic } from 'vscode-languageserver';
import { Scanner } from '../scanner/scanner';
import { Parser } from '../parser/parser';
import { SymbolTableBuilder } from '../analysis/symbolTableBuilder';
import { standardLibraryBuilder } from '../analysis/standardLibrary';
import { PreResolver } from '../analysis/preResolver';
import { Resolver } from '../analysis/resolver';
import { TypeChecker } from '../typeChecker/typeChecker';
import { KsBaseSymbol, KsSymbolKind } from '../analysis/types';
import { unWrap } from '../utilities/typeGuards';
import { booleanType } from '../typeChecker/types/primitives/boolean';
import { primitiveInitializer } from '../typeChecker/types/primitives/initialize';
import { orbitalInitializer } from '../typeChecker/types/orbital/initialize';
import { Type } from '../typeChecker/types/types';
import { doubleType, integerType } from '../typeChecker/types/primitives/scalar';
import { stringType } from '../typeChecker/types/primitives/string';
import { userListType } from '../typeChecker/types/collections/userList';
import { structureType } from '../typeChecker/types/primitives/structure';
// import { pathType } from '../typeChecker/types/io/path';
// import { listType } from '../typeChecker/types/collections/list';

const fakeUri = 'C:\\fake.ks';

primitiveInitializer();
orbitalInitializer();

interface ITypeCheckResults {
  scan: IScanResult;
  parse: IParseResult;
  table: SymbolTable;
  resolveDiagnostics: Diagnostic[];
  typeCheckDiagnostics: Diagnostic[];
}

// parse source
const parseSource = (
  source: string,
): Pick<ITypeCheckResults, 'scan' | 'parse'> => {
  const scanner = new Scanner(source, fakeUri);
  const scan = scanner.scanTokens();

  const parser = new Parser(fakeUri, scan.tokens);
  const parse = parser.parse();

  return { scan, parse };
};

const checkSource = (
  source: string,
  standardLib = false,
): ITypeCheckResults => {
  const result = parseSource(source);

  const symbolTableBuilder = new SymbolTableBuilder(fakeUri);

  if (standardLib) {
    symbolTableBuilder.linkTable(standardLibraryBuilder(CaseKind.lowercase));
  }

  const functionResolver = new PreResolver(
    result.parse.script,
    symbolTableBuilder,
  );
  const resolver = new Resolver(result.parse.script, symbolTableBuilder);

  const preResolverError = functionResolver.resolve();
  const resolverErrors = resolver.resolve();
  const ususedErrors = symbolTableBuilder.findUnused();

  const checker = new TypeChecker(result.parse.script);
  const typeCheckError = checker.check();

  return {
    ...result,
    resolveDiagnostics: preResolverError.concat(resolverErrors, ususedErrors),
    typeCheckDiagnostics: typeCheckError,
    table: symbolTableBuilder.build(),
  };
};

const noErrors = (result: ITypeCheckResults): void => {
  expect(result.scan.scanErrors.length).toBe(0);
  expect(result.parse.parseErrors.length).toBe(0);
  expect(result.resolveDiagnostics.length).toBe(0);
  expect(result.typeCheckDiagnostics.length).toBe(0);
};

const literalSource = `
local b1 is true.
local b2 is false.

local d1 is 10.0.
local d2 is 4e6.

local i is 5.

local fi is file.ks.
local s is "example".

print fi.
print b1.
print i.
print b2.
print d1.
print d2.
print s.
`;

const identiferSource = `
local b1 is true.
local b2 is false.

local d1 is 10.0.
local d2 is 4e6.

local i1 is 5.

local fi1 is file.ks.
local s1 is "example".

local b3 is b1.
local b4 is b2.

local d3 is d1.
local d4 is d2.

local i2 is i1.

local fi2 is fi1.
local s2 is s1.

print fi2.
print i2.
print b3.
print b4.
print d3.
print d4.
print s2.
`;

const collectionSource = `
local a is 0.
local b is "cat".
local c is false.

local l1 is list(1, 2, 3).
local l2 is list(a, b, c).

local x1 is l1[1].
local x2 is l2[1].

print(x1).
print(x2).

for i1 in l1 { print(i1). }
for i2 in l2 { print(i2). }

// need to have userlisttype subtype listtype
// local p is path("example").
// local segments is p:segments.

// local x3 is segments[0].
// print(x3).

// for i3 in segments { print(i3). }
`;

const symbolTests = (
  symbols: Map<string, KsBaseSymbol>,
  name: string,
  symbolKind: KsSymbolKind,
  targetType: Type,
) => {
  expect(symbols.has(name)).toBe(true);
  const nameWrap = symbols.get(name);

  expect(nameWrap).not.toBeUndefined();
  const nameUnWrap = unWrap(nameWrap);

  expect(nameUnWrap.name.lexeme).toBe(name);
  expect(nameUnWrap.tag).toBe(symbolKind);

  expect(nameUnWrap.name.tracker).not.toBeUndefined();

  const nameTrack = unWrap(nameUnWrap.name.tracker);
  expect(nameTrack.declared.type).toBe(targetType);
};

describe('Basic inferring', () => {
  test('Literal inferring', () => {
    const results = checkSource(literalSource);
    noErrors(results);

    const { table } = results;
    const symbols = table.fileSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'b1', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'b2', KsSymbolKind.variable, booleanType);

    symbolTests(names, 'd1', KsSymbolKind.variable, doubleType);
    symbolTests(names, 'd2', KsSymbolKind.variable, doubleType);

    symbolTests(names, 'i', KsSymbolKind.variable, integerType);

    symbolTests(names, 's', KsSymbolKind.variable, stringType);
    symbolTests(names, 'fi', KsSymbolKind.variable, stringType);
  });

  test('Identifier inferring', () => {
    const results = checkSource(identiferSource);
    noErrors(results);

    const { table } = results;
    const symbols = table.fileSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'b3', KsSymbolKind.variable, booleanType);
    symbolTests(names, 'b4', KsSymbolKind.variable, booleanType);

    symbolTests(names, 'd3', KsSymbolKind.variable, doubleType);
    symbolTests(names, 'd4', KsSymbolKind.variable, doubleType);

    symbolTests(names, 'i2', KsSymbolKind.variable, integerType);

    symbolTests(names, 's2', KsSymbolKind.variable, stringType);
    symbolTests(names, 'fi2', KsSymbolKind.variable, stringType);
  });

  test('collection inferring', () => {
    const results = checkSource(collectionSource, true);
    noErrors(results);

    const { table } = results;
    const symbols = table.fileSymbols();
    const names = new Map(
      symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
    );

    symbolTests(names, 'a', KsSymbolKind.variable, integerType);
    symbolTests(names, 'b', KsSymbolKind.variable, stringType);
    symbolTests(names, 'c', KsSymbolKind.variable, booleanType);

    symbolTests(names, 'l1', KsSymbolKind.variable, userListType);
    symbolTests(names, 'l2', KsSymbolKind.variable, userListType);

    symbolTests(names, 'x1', KsSymbolKind.variable, structureType);
    symbolTests(names, 'x2', KsSymbolKind.variable, structureType);

    symbolTests(names, 'i1', KsSymbolKind.variable, structureType);
    symbolTests(names, 'i2', KsSymbolKind.variable, structureType);

    // symbolTests(names, 'p', KsSymbolKind.variable, pathType);
    // symbolTests(names, 'segments', KsSymbolKind.variable, listType.toConcreteType(stringType));

    // symbolTests(names, 'x3', KsSymbolKind.variable, stringType);
    // symbolTests(names, 'i3', KsSymbolKind.variable, stringType);
  });
});
