import { Tokenized } from '../../src/scanner/types';
import { Ast } from '../../src/parser/types';
import { SymbolTable } from '../../src/analysis/models/symbolTable';
import {
  Diagnostic,
  Range,
  DiagnosticSeverity
} from 'vscode-languageserver';
import { Scanner } from '../../src/scanner/scanner';
import { Parser } from '../../src/parser/parser';
import { SymbolTableBuilder } from '../../src/analysis/models/symbolTableBuilder';
import { standardLibraryBuilder } from '../../src/analysis/standardLibrary';
import { PreResolver } from '../../src/analysis/preResolver';
import { Resolver } from '../../src/analysis/resolver';
import { TypeChecker } from '../../src/typeChecker/typeChecker';
import { KsBaseSymbol, KsSymbolKind } from '../../src/analysis/types';
import { unWrap, empty } from '../../src/utilities/typeGuards';
import { booleanType } from '../../src/typeChecker/ksTypes/primitives/boolean';
import {
  doubleType,
  integerType,
  scalarType,
} from '../../src/typeChecker/ksTypes/primitives/scalar';
import { stringType } from '../../src/typeChecker/ksTypes/primitives/string';
import { userListType } from '../../src/typeChecker/ksTypes/collections/userList';
import { structureType } from '../../src/typeChecker/ksTypes/primitives/structure';
import { vectorType } from '../../src/typeChecker/ksTypes/collections/vector';
import { directionType } from '../../src/typeChecker/ksTypes/collections/direction';
import { Marker } from '../../src/scanner/models/marker';
import { zip } from '../../src/utilities/arrayUtils';
import { typeInitializer } from '../../src/typeChecker/initialize';
import { bodyAtmosphereType } from '../../src/typeChecker/ksTypes/bodyatmosphere';
import { listType } from '../../src/typeChecker/ksTypes/collections/list';
import { partType } from '../../src/typeChecker/ksTypes/parts/part';
import { IType } from '../../src/typeChecker/types';
import { pathType } from '../../src/typeChecker/ksTypes/io/path';
import { KsFunction } from '../../src/models/function';
import { createUnion } from '../../src/typeChecker/utilities/typeCreators';
import { noneType } from '../../src/typeChecker/ksTypes/primitives/none';
import { DIAGNOSTICS } from '../../src/utilities/diagnosticsUtils';
import { timeStampType } from '../../src/typeChecker/ksTypes/time/timestamp';

const fakeUri = 'C:\\fake.ks';

typeInitializer();

interface ITypeCheckResults {
  scan: Tokenized;
  parse: Ast;
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
    symbolTableBuilder.linkDependency(
      standardLibraryBuilder(CaseKind.lowerCase),
    );
  }

  const functionResolver = new PreResolver(
    result.parse.script,
    symbolTableBuilder,
  );
  const resolver = new Resolver(result.parse.script, symbolTableBuilder);

  const preResolverError = functionResolver.resolve();
  const resolverErrors = resolver.resolve();
  const unusedErrors = symbolTableBuilder.findUnused();

  debugger;
  const checker = new TypeChecker(result.parse.script);
  const typeCheckError = checker.check();

  return {
    ...result,
    resolveDiagnostics: preResolverError.concat(resolverErrors, unusedErrors),
    typeCheckDiagnostics: typeCheckError,
    table: symbolTableBuilder.build(),
  };
};

const noResolverErrors = (result: ITypeCheckResults): void => {
  expect(result.scan.diagnostics.map(e => e.message)).toEqual([]);
  expect(result.parse.diagnostics.map(e => e.message)).toEqual([]);
  expect(result.resolveDiagnostics.map(e => e.message)).toEqual([]);
};

const noErrors = (result: ITypeCheckResults): void => {
  expect(result.scan.diagnostics.map(e => e.message)).toEqual([]);
  expect(result.parse.diagnostics.map(e => e.message)).toEqual([]);
  expect(result.resolveDiagnostics.map(e => e.message)).toEqual([]);
  expect(result.typeCheckDiagnostics.map(e => e.message)).toEqual([]);
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
local p is path("example").
local segments is p:segments.

local x3 is segments[0].
print(x3).

for i3 in segments { print(i3). }
`;

const suffixSource = `
local atm is body:atm.
local length is list():length.
local parts is ship:parts.
local partFacing is ship:parts[0]:facing.
local distance is body:geopositionlatlng(10, 10):distance.

print(atm).
print(length).
print(parts).
print(partFacing).
print(distance).
`;

const declaredTests = (
  symbols: Map<string, KsBaseSymbol>,
  name: string,
  symbolKind: KsSymbolKind,
  targetType?: IType,
) => {
  expect(symbols.has(name)).toBe(true);
  const nameWrap = symbols.get(name);

  expect(nameWrap).toBeDefined();
  const nameUnWrap = unWrap(nameWrap);

  expect(nameUnWrap.name.lexeme).toBe(name);
  expect(nameUnWrap.tag).toBe(symbolKind);

  expect(nameUnWrap.name.tracker).toBeDefined();

  if (!empty(targetType)) {
    const nameTrack = unWrap(nameUnWrap.name.tracker);
    expect(nameTrack.declared.type).toBe(targetType);
  }
};

const toSymbolMap = (table: SymbolTable) => {
  const symbols = table.allSymbols();
  return new Map(
    symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
  );
};

const unarySource = `
function f { }
local x is 10.
lock l to x.

local d1 is defined f.
local d2 is defined x.
local d3 is defined l.

print(d1).
print(d2).
print(d3).

local b1 is not true.
local b2 is not false.
local b3 is not (10 > 5).

print(b1).
print(b2).
print(b3).

local n1 is -10.
local n2 is -16.3.
local n3 is +18.3.
lock n4 to -v(1, 1, 1).
local n5 is +q(1, 1, 1, 1).

print(n1).
print(n2).
print(n3).
print(n4).
print(n5).
`;

const unaryDiagnosticSource = `
function f {}.

local b1 is not f.
local n1 is -"test".

print(b1).
print(n1).
`;

const structureDiagnosticSource = `
function example {
  parameter a, b.

  local c is a / b.
  return c.
}
`;

const binaryMultiplicationSource = `
local s1 is 10 * 10.

local v1 is v(1, 1, 1) * v(1, 1, 1).
local v2 is v(1, 1, 1) * 10.

local d1 is q(1, 1, 1, 1) * v(1, 1, 1).
local d2 is q(1, 1, 1, 1) * q(1, 1, 1, 1).

local t1 is time * 10.

print(s1).

print(v1).
print(v2).

print(d1).
print(d2).

print(t1).
`;

const binaryAdditionSource = `
local s1 is 10 + 10.
local str1 is "cat" + "dog".

local v1 is v(1, 1, 1) + v(1, 1, 1).

local d1 is q(1, 1, 1, 1) + v(1, 1, 1).
local d2 is q(1, 1, 1, 1) + q(1, 1, 1, 1).

local t1 is time + time.
local t2 is time + 10.

print(s1).
print(str1).

print(v1).

print(d1).
print(d2).

print(t1).
print(t2).
`;

const binaryLogicalSource = `
local l1 is true and true.
local l2 is true or true.
local l3 is ship or true.
local l4 is 10 and 20.
local l5 is "true" or "false".

print(l1).
print(l2).
print(l3).
print(l4).
print(l5).
`;

const factorSource = `
local l1 is 10 ^ 10.
local l2 is 10 ^ 10.0.
local l3 is 10.0 ^ 10.
local l4 is 10.0 ^ 10.0.

local i is 10.
local d is 10.0.

local e1 is i ^ i.
local e2 is i ^ d.
local e3 is d ^ i.
local e4 is d ^ d.

print(l1).
print(l2).
print(l3).
print(l4).

print(e1).
print(e2).
print(e3).
print(e4).
`;

const forValidSource = `
for x in list() {
  print(x).
}

for part in ship:parts {
  print(part).
}

for name in 10:suffixnames {
  print(name).
}
`;

const forInValidSource = `
for r in ship:rootpart {
  print(r).
}

for b in body {
  print(b).
}
`;

const declareFuncSource = `
function example {
  parameter x, y is 10.

  print(x).
  print(y).
  return 10.
}
`;

const noGetterSource = `
print(ship:control:neutralize).
print(ship:control:resetTrim).
`;

const noSetterSource = `
set ship:up to v(1, 1, 1).

local box is gui(1, 1).
set box:gui to gui(2, 2).
print(box).
`;

const setValidSource = `
local declareFirst to 10.
set declareFirst to "cat".

set setFirst to 10.
local l is setFirst:suffixnames.
set l[0] to "example".

print(declareFirst).
print(setFirst).
print(l).
`;

const setDiagnosticsSource = `@lazyglobal off.
set ship:rootPart to ship:rootPart.
local parts is ship:parts.
set parts[0] to 10.
print(parts).
`;

const tooManyArgsSource = 'ceiling(10, 10, 10).';

const tooFewArgsSource = 'ceiling().';

const tooFewOptionalArgsSource = 'heading(10).';

const wrongTypeArgsSource = 'ceiling("10").';

const structureCallSource = `
function example {
  parameter a.
  a().
}
`;

describe('typeChecker', () => {
  describe('inference', () => {
    describe('basic inference', () => {
      test('infers literals', () => {
        const results = checkSource(literalSource);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 'b1', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'b2', KsSymbolKind.variable, booleanType);

        declaredTests(names, 'd1', KsSymbolKind.variable, doubleType);
        declaredTests(names, 'd2', KsSymbolKind.variable, doubleType);

        declaredTests(names, 'i', KsSymbolKind.variable, integerType);

        declaredTests(names, 's', KsSymbolKind.variable, stringType);
        declaredTests(names, 'fi', KsSymbolKind.variable, stringType);
      });

      test('infers identifier', () => {
        const results = checkSource(identiferSource);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 'b3', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'b4', KsSymbolKind.variable, booleanType);

        declaredTests(names, 'd3', KsSymbolKind.variable, doubleType);
        declaredTests(names, 'd4', KsSymbolKind.variable, doubleType);

        declaredTests(names, 'i2', KsSymbolKind.variable, integerType);

        declaredTests(names, 's2', KsSymbolKind.variable, stringType);
        declaredTests(names, 'fi2', KsSymbolKind.variable, stringType);
      });

      test('infers collection', () => {
        const results = checkSource(collectionSource, true);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 'a', KsSymbolKind.variable, integerType);
        declaredTests(names, 'b', KsSymbolKind.variable, stringType);
        declaredTests(names, 'c', KsSymbolKind.variable, booleanType);

        declaredTests(names, 'l1', KsSymbolKind.variable, userListType);
        declaredTests(names, 'l2', KsSymbolKind.variable, userListType);

        declaredTests(names, 'x1', KsSymbolKind.variable, structureType);
        declaredTests(names, 'x2', KsSymbolKind.variable, structureType);

        declaredTests(names, 'i1', KsSymbolKind.variable, structureType);
        declaredTests(names, 'i2', KsSymbolKind.variable, structureType);

        declaredTests(names, 'p', KsSymbolKind.variable, pathType);
        declaredTests(
          names,
          'segments',
          KsSymbolKind.variable,
          listType.apply(stringType),
        );

        declaredTests(names, 'x3', KsSymbolKind.variable, stringType);
        declaredTests(names, 'i3', KsSymbolKind.variable, stringType);
      });

      test('infers suffixes', () => {
        const results = checkSource(suffixSource, true);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 'atm', KsSymbolKind.variable, bodyAtmosphereType);
        declaredTests(names, 'length', KsSymbolKind.variable, integerType);
        declaredTests(
          names,
          'parts',
          KsSymbolKind.variable,
          listType.apply(partType),
        );
        declaredTests(
          names,
          'partFacing',
          KsSymbolKind.variable,
          directionType,
        );
        declaredTests(names, 'distance', KsSymbolKind.variable, scalarType);
      });
    });

    describe('operators', () => {
      test('infers unary operators', () => {
        const results = checkSource(unarySource, true);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 'f', KsSymbolKind.function);
        declaredTests(names, 'x', KsSymbolKind.variable, integerType);
        declaredTests(names, 'l', KsSymbolKind.lock, integerType);

        declaredTests(names, 'd1', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'd2', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'd3', KsSymbolKind.variable, booleanType);

        declaredTests(names, 'b1', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'b2', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'b3', KsSymbolKind.variable, booleanType);

        declaredTests(names, 'n1', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'n2', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'n3', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'n4', KsSymbolKind.lock, vectorType);
        declaredTests(names, 'n5', KsSymbolKind.variable, directionType);
      });

      test('infers binary multiplication operators', () => {
        const results = checkSource(binaryMultiplicationSource, true);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 's1', KsSymbolKind.variable, scalarType);

        declaredTests(names, 'v1', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'v2', KsSymbolKind.variable, vectorType);

        declaredTests(names, 'd1', KsSymbolKind.variable, vectorType);
        declaredTests(names, 'd2', KsSymbolKind.variable, directionType);

        declaredTests(names, 't1', KsSymbolKind.variable, timeStampType);
      });

      test('infers binary plus operators', () => {
        const results = checkSource(binaryAdditionSource, true);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 's1', KsSymbolKind.variable, scalarType);

        declaredTests(names, 'str1', KsSymbolKind.variable, stringType);

        declaredTests(names, 'v1', KsSymbolKind.variable, vectorType);

        declaredTests(names, 'd1', KsSymbolKind.variable, vectorType);
        declaredTests(names, 'd2', KsSymbolKind.variable, directionType);

        declaredTests(names, 't1', KsSymbolKind.variable, timeStampType);
        declaredTests(names, 't2', KsSymbolKind.variable, timeStampType);
      });

      test('infers logical and operators', () => {
        const results = checkSource(binaryLogicalSource, true);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 'l1', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'l2', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'l3', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'l4', KsSymbolKind.variable, booleanType);
        declaredTests(names, 'l5', KsSymbolKind.variable, booleanType);
      });

      test('infers factor operator', () => {
        const results = checkSource(factorSource, true);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 'i', KsSymbolKind.variable, integerType);
        declaredTests(names, 'd', KsSymbolKind.variable, doubleType);

        declaredTests(names, 'l1', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'l2', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'l3', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'l4', KsSymbolKind.variable, scalarType);

        declaredTests(names, 'e1', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'e2', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'e3', KsSymbolKind.variable, scalarType);
        declaredTests(names, 'e4', KsSymbolKind.variable, scalarType);
      });
    });

    describe('statements', () => {
      test('infer for loop', () => {
        const results = checkSource(forValidSource, true);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 'x', KsSymbolKind.variable, structureType);
        declaredTests(names, 'part', KsSymbolKind.variable, partType);
        declaredTests(names, 'name', KsSymbolKind.variable, stringType);
      });

      describe('declare function', () => {
        test('infers single single exit', () => {
          const results = checkSource(declareFuncSource, true);
          noErrors(results);

          const { table } = results;
          const symbols = table.allSymbols();
          const names = new Map(
            symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
          );

          declaredTests(names, 'x', KsSymbolKind.parameter, structureType);
          declaredTests(names, 'y', KsSymbolKind.parameter, integerType);
          declaredTests(names, 'example', KsSymbolKind.function);

          const func = names.get('example')! as KsFunction;
          const tracker = func.name.tracker!;
          const type = tracker.declared.type;

          const callSignature = type.callSignature();
          expect(callSignature).toBeDefined();

          const params = callSignature!.params();
          const returns = callSignature!.returns();

          expect(params).toHaveLength(2);
          const [first, second] = params;

          expect(first).toBe(structureType);
          expect(second).toBe(createUnion(true, structureType, noneType));
          expect(returns).toBe(structureType);
        });
      });

      test('infers set', () => {
        const results = checkSource(setValidSource, true);
        noErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(
          names,
          'declareFirst',
          KsSymbolKind.variable,
          integerType,
        );
        declaredTests(names, 'setFirst', KsSymbolKind.variable, integerType);

        // TODO
        // const setFirst = table.scopedNamedTracker(
        //   { line: 0, character: 0 },
        //   'setfirst',
        // )!;
        // expect(setFirst).toBeDefined();
        // const loc = Location.create(
        //   fakeUri,
        //   Range.create(Position.create(2, 4), Position.create(2, 16)),
        // );

        // const setType = setFirst.getType(loc);
        // expect(setType).toBeDefined();
        // expect(setType!.name).toBe(stringType.name);

        declaredTests(
          names,
          'l',
          KsSymbolKind.variable,
          listType.apply(stringType),
        );
      });
    });
  });

  describe('diagnostics', () => {
    describe('wrong access', () => {
      const noGetterLocations: Range[] = [
        { start: new Marker(1, 6), end: new Marker(1, 29) },
        { start: new Marker(2, 6), end: new Marker(2, 28) },
      ];

      describe('no getter', () => {
        test('it produces TYPE_NO_GETTER', () => {
          const results = checkSource(noGetterSource, true);
          noResolverErrors(results);

          const sortedErrors = results.typeCheckDiagnostics.sort(
            (a, b) => a.range.start.line - b.range.start.line,
          );

          for (const [error, location] of zip(
            sortedErrors,
            noGetterLocations,
          )) {
            expect(error.severity).toBe(DiagnosticSeverity.Hint);
            expect(error.code).toBe(DIAGNOSTICS.TYPE_NO_GETTER);
            expect(location.start).toEqual(error.range.start);
            expect(location.end).toEqual(error.range.end);
          }
        });
      });

      describe('no setter', () => {
        const noSetterLocations: Range[] = [
          { start: new Marker(1, 4), end: new Marker(1, 11) },
          { start: new Marker(4, 4), end: new Marker(4, 11) },
        ];

        test('it produces TYPE_NO_SETTER', () => {
          const results = checkSource(noSetterSource, true);
          noResolverErrors(results);

          const sortedErrors = results.typeCheckDiagnostics.sort(
            (a, b) => a.range.start.line - b.range.start.line,
          );

          for (const [error, location] of zip(
            sortedErrors,
            noSetterLocations,
          )) {
            expect(error.severity).toBe(DiagnosticSeverity.Hint);
            expect(error.code).toBe(DIAGNOSTICS.TYPE_NO_SETTER);
            expect(location.start).toEqual(error.range.start);
            expect(location.end).toEqual(error.range.end);
          }
        });
      });
    });

    describe('operators', () => {
      const unaryLocations: Range[] = [
        { start: new Marker(3, 16), end: new Marker(3, 17) },
        { start: new Marker(4, 13), end: new Marker(4, 19) },
      ];

      describe('unary operator', () => {
        test('reports unary operator diagnostics', () => {
          const results = checkSource(unaryDiagnosticSource, true);
          noResolverErrors(results);

          const names = toSymbolMap(results.table);

          declaredTests(names, 'b1', KsSymbolKind.variable, booleanType);
          declaredTests(names, 'n1', KsSymbolKind.variable, structureType);

          const sortedErrors = results.typeCheckDiagnostics.sort(
            (a, b) => a.range.start.line - b.range.start.line,
          );

          for (const [error, location] of zip(sortedErrors, unaryLocations)) {
            expect(error.severity).toBe(DiagnosticSeverity.Hint);
            expect(location.start).toEqual(error.range.start);
            expect(location.end).toEqual(error.range.end);
          }
        });
      });

      describe('when binary between structures', () => {
        test('does not report error', () => {
          const results = checkSource(structureDiagnosticSource, true);
          noErrors(results);

          const names = toSymbolMap(results.table);
          declaredTests(names, 'example', KsSymbolKind.function);
          declaredTests(names, 'a', KsSymbolKind.parameter, structureType);
          declaredTests(names, 'b', KsSymbolKind.parameter, structureType);
          declaredTests(names, 'c', KsSymbolKind.variable, structureType);
        });
      });
    });

    describe('call signature', () => {
      describe('when too many arguments', () => {
        test('it produces a TYPE_WRONG_ARITY diagnostics', () => {
          const results = checkSource(tooManyArgsSource, true);
          noResolverErrors(results);

          expect(results.typeCheckDiagnostics).toHaveLength(1);
          const error = results.typeCheckDiagnostics[0];

          expect(error.severity).toBe(DiagnosticSeverity.Hint);
          expect(error.range.start).toEqual({ line: 0, character: 16 });
          expect(error.range.end).toEqual({ line: 0, character: 18 });
          expect(error.code).toBe(DIAGNOSTICS.TYPE_WRONG_ARITY);
        });
      });

      describe('when too few arguments', () => {
        describe('when no optional parameters', () => {
          test('it produces a TYPE_WRONG_ARITY diagnostics', () => {
            const results = checkSource(tooFewArgsSource, true);
            noResolverErrors(results);

            expect(results.typeCheckDiagnostics).toHaveLength(1);
            const error = results.typeCheckDiagnostics[0];

            expect(error.severity).toBe(DiagnosticSeverity.Hint);
            expect(error.range.start).toEqual({ line: 0, character: 8 });
            expect(error.range.end).toEqual({ line: 0, character: 9 });
            expect(error.code).toBe(DIAGNOSTICS.TYPE_WRONG_ARITY);
          });
        });

        describe('when optional parameters', () => {
          test('it produces a TYPE_WRONG_ARITY diagnostics', () => {
            const results = checkSource(tooFewOptionalArgsSource, true);
            noResolverErrors(results);

            expect(results.typeCheckDiagnostics).toHaveLength(1);
            const error = results.typeCheckDiagnostics[0];

            expect(error.severity).toBe(DiagnosticSeverity.Hint);
            expect(error.range.start).toEqual({ line: 0, character: 10 });
            expect(error.range.end).toEqual({ line: 0, character: 11 });
            expect(error.code).toBe(DIAGNOSTICS.TYPE_WRONG_ARITY);
          });
        });
      });

      describe('when arguments are the wrong type', () => {
        test('it produces a TYPE_WRONG diagnostics', () => {
          const results = checkSource(wrongTypeArgsSource, true);
          noResolverErrors(results);

          expect(results.typeCheckDiagnostics).toHaveLength(1);
          const error = results.typeCheckDiagnostics[0];

          expect(error.severity).toBe(DiagnosticSeverity.Hint);
          expect(error.range.start).toEqual({ line: 0, character: 8 });
          expect(error.range.end).toEqual({ line: 0, character: 12 });
          expect(error.code).toEqual(DIAGNOSTICS.TYPE_WRONG);
        });
      });

      describe('when structure', () => {
        test('does not report error', () => {
          const results = checkSource(structureCallSource, true);
          noErrors(results);

          const names = toSymbolMap(results.table);
          declaredTests(names, 'example', KsSymbolKind.function);
          declaredTests(names, 'a', KsSymbolKind.parameter);
        });
      });
    });

    describe('statements', () => {
      const setErrorsLocation: Range[] = [
        {
          start: { line: 1, character: 4 },
          end: { line: 1, character: 17 },
        },
        {
          start: { line: 3, character: 4 },
          end: { line: 3, character: 12 },
        },
      ];

      test('set', () => {
        const results = checkSource(setDiagnosticsSource, true);
        noResolverErrors(results);

        expect(results.typeCheckDiagnostics).toHaveLength(
          setErrorsLocation.length,
        );

        for (const [error, location] of zip(
          results.typeCheckDiagnostics,
          setErrorsLocation,
        )) {
          expect(error.severity).toBe(DiagnosticSeverity.Hint);
          expect(error.range.start).toEqual(location.start);
          expect(error.range.end).toEqual(location.end);
        }
      });

      const iteratorErrorsLocation: Range[] = [
        {
          start: { line: 1, character: 9 },
          end: { line: 1, character: 22 },
        },
        {
          start: { line: 5, character: 9 },
          end: { line: 5, character: 13 },
        },
      ];

      test('for loop invalid', () => {
        const results = checkSource(forInValidSource, true);
        noResolverErrors(results);

        const { table } = results;
        const symbols = table.allSymbols();
        const names = new Map(
          symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
        );

        declaredTests(names, 'r', KsSymbolKind.variable, structureType);
        declaredTests(names, 'b', KsSymbolKind.variable, structureType);
        expect(results.typeCheckDiagnostics).toHaveLength(
          iteratorErrorsLocation.length,
        );

        for (const [error, location] of zip(
          results.typeCheckDiagnostics,
          iteratorErrorsLocation,
        )) {
          expect(error.severity).toBe(DiagnosticSeverity.Hint);
          expect(error.range.start).toEqual(location.start);
          expect(error.range.end).toEqual(location.end);
        }
      });
    });
  });
});
