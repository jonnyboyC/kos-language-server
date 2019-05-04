import { Parser } from '../parser/parser';
import { Scanner } from '../scanner/scanner';
import { IParseResult } from '../parser/types';
import { empty, unWrap, unWrapMany } from '../utilities/typeGuards';
import { rangeEqual } from '../utilities/positionUtils';
import { Range, Diagnostic, DiagnosticSeverity, Position } from 'vscode-languageserver';
import { structureType } from '../typeChecker/types/primitives/structure';
import { IScanResult } from '../scanner/types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { zip } from '../utilities/arrayUtils';
import { Marker } from '../entities/token';
import { SymbolTable } from '../analysis/symbolTable';
import { SymbolTableBuilder } from '../analysis/symbolTableBuilder';
import { PreResolver } from '../analysis/preResolver';
import { KsSymbol, KsSymbolKind, IKsSymbolTracker } from '../analysis/types';
import { Resolver } from '../analysis/resolver';
import { standardLibrary } from '../analysis/standardLibrary';
import { FunctionScan } from '../analysis/functionScan';
import * as Decl from '../parser/declare';

const fakeUri = 'C:\\fake.ks';

interface IResolveResults {
  scan: IScanResult;
  parse: IParseResult;
  table: SymbolTable;
  resolveDiagnostics: Diagnostic[];
}

// parse source
const parseSource = (source: string)
  : Pick<IResolveResults, 'scan' | 'parse'> => {
  const scanner = new Scanner(source, fakeUri);
  const scan = scanner.scanTokens();

  const parser = new Parser(fakeUri, scan.tokens);
  const parse = parser.parse();

  return { scan, parse };
};

const resolveSource = (source: string, standardLib = false): IResolveResults => {
  const result = parseSource(source);

  const symbolTableBuilder = new SymbolTableBuilder(fakeUri);

  if (standardLib) {
    symbolTableBuilder.linkTable(standardLibrary);
  }

  const functionResolver = new PreResolver(result.parse.script, symbolTableBuilder);
  const resolver = new Resolver(result.parse.script, symbolTableBuilder);

  const preResolverError = functionResolver.resolve();
  const resolverErrors = resolver.resolve();
  const ususedErrors = symbolTableBuilder.findUnused();

  return {
    ...result,
    resolveDiagnostics: preResolverError.concat(resolverErrors, ususedErrors),
    table: symbolTableBuilder.build(),
  };
};

const makeRange = (sLine: number, schar: number, eLine: number, echar: number): Range => {
  return {
    start: {
      line: sLine,
      character: schar,
    },
    end: {
      line: eLine,
      character: echar,
    },
  };
};

const noParseErrors = (result: Pick<IResolveResults, 'scan' | 'parse'>): void => {
  expect(result.scan.scanErrors.length).toBe(0);
  expect(result.parse.parseErrors.length).toBe(0);
};

const noErrors = (result: IResolveResults): void => {
  expect(result.scan.scanErrors.length).toBe(0);
  expect(result.parse.parseErrors.length).toBe(0);
  expect(result.resolveDiagnostics.length).toBe(0);
};

const setSource =
`
set x to 10.
set x to "cat".

set y to false.
set x to y.
print x.
`;

const lazyListSource =
`
function example {
  parameter y.
  list files in y.
  print y.
}

list files in x.
print x.
`;

describe('Resolver tracking', () => {
  // test basic identifier
  test('basic set test', () => {
    const results = resolveSource(setSource);
    noErrors(results);

    const { table } = results;
    const symbols = table.fileSymbols();
    const names = new Map(symbols.map((s): [string, KsSymbol] => [s.name.lexeme, s]));

    expect(names.has('x')).toBe(true);
    expect(names.has('y')).toBe(true);

    const xWrap = names.get('x');
    const yWrap = names.get('y');

    expect(empty(xWrap)).toBe(false);
    expect(empty(yWrap)).toBe(false);

    const x = unWrap(xWrap);
    const y = unWrap(yWrap);

    expect(x.name.lexeme).toBe('x');
    expect(y.name.lexeme).toBe('y');

    expect(x.tag).toBe(KsSymbolKind.variable);
    expect(y.tag).toBe(KsSymbolKind.variable);
  });

  // test basic identifier
  test('basic tracker set test', () => {
    const results = resolveSource(setSource);
    noErrors(results);

    const { table } = results;
    const xTrack = table.scopedNamedTracker({ line: 0, character: 0 }, 'x');
    const yTrack = table.scopedNamedTracker({ line: 0, character: 0 }, 'y');

    expect(empty(xTrack)).toBe(false);
    expect(empty(yTrack)).toBe(false);

    const [x, y] = unWrapMany(xTrack, yTrack);

    const xRange: Range = {
      start: { line: 1, character: 4 },
      end: { line: 1, character: 5 },
    };
    const yRange: Range = {
      start: { line: 4, character: 4 },
      end: { line: 4, character: 5 },
    };

    expect(rangeEqual(x.declared.range, xRange)).toBe(true);
    expect(rangeEqual(y.declared.range, yRange)).toBe(true);

    // check the tracked declared properties
    expect(x.declared.uri).toBe(fakeUri);
    expect(y.declared.uri).toBe(fakeUri);

    // should only be structure as it is the default placeholder
    expect(x.declared.type).toBe(structureType);
    expect(y.declared.type).toBe(structureType);

    expect(x.declared.symbol.name.lexeme).toBe('x');
    expect(y.declared.symbol.name.lexeme).toBe('y');

    expect(x.declared.symbol.tag).toBe(KsSymbolKind.variable);
    expect(y.declared.symbol.tag).toBe(KsSymbolKind.variable);

    // check the tracked set properties
    // resolver doesn't track sets
    expect(x.sets.length).toBe(0);
    expect(y.sets.length).toBe(0);

    // check the tracked set properties
    expect(x.usages.length).toBe(1);
    expect(y.usages.length).toBe(1);

    const [yUsage] = y.usages;
    const [xUsage] = x.usages;

    const xUsageRange: Range = {
      start: { line: 6, character: 6 },
      end: { line: 6, character: 7 },
    };
    const yUsageRange: Range = {
      start: { line: 5, character: 9 },
      end: { line: 5, character: 10 },
    };

    expect(rangeEqual(xUsage.range, xUsageRange)).toBe(true);
    expect(rangeEqual(yUsage.range, yUsageRange)).toBe(true);

    expect(xUsage.uri).toBe(fakeUri);
    expect(yUsage.uri).toBe(fakeUri);

    expect(xUsage.type).toBe(structureType);
    expect(yUsage.type).toBe(structureType);
  });

  test('lazy list test', () => {
    const results = resolveSource(lazyListSource);
    noErrors(results);

    const { table } = results;
    const symbols = table.fileSymbols();
    const names = new Map(symbols.map((s): [string, KsSymbol] => [s.name.lexeme, s]));

    expect(names.has('x')).toBe(true);
    expect(names.has('y')).toBe(true);

    const xWrap = names.get('x');
    const yWrap = names.get('y');

    expect(empty(xWrap)).toBe(false);
    expect(empty(yWrap)).toBe(false);

    const x = unWrap(xWrap);
    const y = unWrap(yWrap);

    expect(x.name.lexeme).toBe('x');
    expect(y.name.lexeme).toBe('y');

    expect(x.tag).toBe(KsSymbolKind.variable);
    expect(y.tag).toBe(KsSymbolKind.parameter);
  });

  const symbolKindPath = join(
    __dirname,
    '../../../kerboscripts/parser_valid/unitTests/scannertest.ks',
  );

  // test basic identifier
  test('symbol kind', () => {
    const symbolKindSource = readFileSync(symbolKindPath, 'utf8');
    const results = resolveSource(symbolKindSource, true);
    noErrors(results);

    let outOfScope: Maybe<IKsSymbolTracker>;
    let range: Range;

    const { table } = results;
    const testTracker = table.scopedNamedTracker({ line: 0, character: 0 }, 'test');

    // check test function
    expect(testTracker).not.toBeUndefined();
    if (testTracker !== undefined) {
      const { name, tag } = testTracker.declared.symbol;
      expect(name.lexeme).toBe('test');

      range =  makeRange(3, 16, 3, 20);
      expect(rangeEqual(name, range)).toBe(true);
      expect(tag).toBe(KsSymbolKind.function);
      expect(testTracker.usages.length).toBe(1);
    }

    // check param a
    const aParamTracker = table.scopedNamedTracker({ line: 4, character: 0 }, 'a');
    outOfScope = table.scopedNamedTracker(Position.create(0, 0), 'a');

    expect(outOfScope).toBeUndefined();
    expect(aParamTracker).not.toBeUndefined();
    if (aParamTracker !== undefined) {
      const { name, tag } = aParamTracker.declared.symbol;
      expect(name.lexeme).toBe('a');

      range =  makeRange(4, 14, 4, 15);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.parameter);
      expect(aParamTracker.usages.length).toBe(1);
    }

    // check param b
    const bParamTracker = table.scopedNamedTracker({ line: 4, character: 0 }, 'b');
    outOfScope = table.scopedNamedTracker(Position.create(0, 0), 'b');

    expect(outOfScope).toBeUndefined();
    expect(bParamTracker).not.toBeUndefined();
    if (bParamTracker !== undefined) {
      const { name, tag } = bParamTracker.declared.symbol;
      expect(name.lexeme).toBe('b');

      range =  makeRange(4, 17, 4, 18);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.parameter);
      expect(bParamTracker.usages.length).toBe(1);
    }

    // check loop i
    const iTracker = table.scopedNamedTracker({ line: 8, character: 0 }, 'i');
    outOfScope = table.scopedNamedTracker(Position.create(6, 0), 'i');

    expect(outOfScope).toBeUndefined();
    expect(iTracker).not.toBeUndefined();
    if (iTracker !== undefined) {
      const { name, tag } = iTracker.declared.symbol;
      expect(name.lexeme).toBe('i');

      range =  makeRange(7, 8, 7, 9);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.variable);
      expect(iTracker.usages.length).toBe(1);
    }

    // check loop x
    const xTracker = table.scopedNamedTracker({ line: 13, character: 0 }, 'x');
    outOfScope = table.scopedNamedTracker(Position.create(15, 0), 'x');

    expect(outOfScope).toBeUndefined();
    expect(xTracker).not.toBeUndefined();
    if (xTracker !== undefined) {
      const { name, tag } = xTracker.declared.symbol;
      expect(name.lexeme).toBe('x');

      range =  makeRange(11, 17, 11, 18);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.variable);
      expect(xTracker.usages.length).toBe(3);
    }

    // check loop x
    const tTracker = table.scopedNamedTracker({ line: 16, character: 0 }, 't');

    expect(tTracker).not.toBeUndefined();
    if (tTracker !== undefined) {
      const { name, tag } = tTracker.declared.symbol;
      expect(name.lexeme).toBe('t');

      range =  makeRange(17, 5, 17, 6);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.lock);
      expect(tTracker.usages.length).toBe(2);
    }
  });
});

const listSource =
`
@lazyglobal off.
list files in x.
`;

describe('Resolver errors', () => {
  const listLocations: Range[] = [
    { start: new Marker(2, 14), end: new Marker(2, 15) },
  ];

  // test basic identifier
  test('basic list test', () => {
    const results = resolveSource(listSource);

    expect(0).toBe(results.scan.scanErrors.length);
    expect(0).toBe(results.parse.parseErrors.length);
    expect(results.resolveDiagnostics.length > 0).toBe(true);

    for (const [error, location] of zip(results.resolveDiagnostics, listLocations)) {
      expect(DiagnosticSeverity.Error).toBe(error.severity);
      expect(location.start).toEqual(error.range.start);
      expect(location.end).toEqual(error.range.end);
    }
  });

  const definedPath = join(
    __dirname,
    '../../../kerboscripts/parser_valid/unitTests/definedtest.ks',
  );

  const definedLocations: Range[] = [
    { start: new Marker(7, 42), end: new Marker(7, 46) },
    { start: new Marker(10, 42), end: new Marker(10, 46) },
    { start: new Marker(26, 43), end: new Marker(26, 59) },
    { start: new Marker(32, 41), end: new Marker(32, 51) },
    { start: new Marker(33, 41), end: new Marker(33, 57) },
    { start: new Marker(51, 43), end: new Marker(51, 54) },
    { start: new Marker(55, 41), end: new Marker(55, 52) },
    { start: new Marker(56, 41), end: new Marker(56, 52) },
  ];

  // test basic identifier
  test('basic defined test', () => {
    const defineSource = readFileSync(definedPath, 'utf8');
    const results = resolveSource(defineSource);

    expect(0).toBe(results.scan.scanErrors.length);
    expect(0).toBe(results.parse.parseErrors.length);
    expect(results.resolveDiagnostics.length > 0).toBe(true);

    const sortedErrors = results.resolveDiagnostics
      .sort((a, b) => a.range.start.line - b.range.start.line);

    for (const [error, location] of zip(sortedErrors, definedLocations)) {
      expect(DiagnosticSeverity.Error).toBe(error.severity);
      expect(location.start).toEqual(error.range.start);
      expect(location.end).toEqual(error.range.end);
    }
  });

  const usedPath = join(
    __dirname,
    '../../../kerboscripts/parser_valid/unitTests/usedtest.ks',
  );

  const usedLocations: Range[] = [
    { start: new Marker(1, 6), end: new Marker(1, 7) },
    { start: new Marker(2, 6), end: new Marker(2, 7) },
  ];

  // test basic identifier
  test('basic used test', () => {
    const usedSource = readFileSync(usedPath, 'utf8');
    const results = resolveSource(usedSource);

    expect(results.scan.scanErrors.length).toBe(0);
    expect(results.parse.parseErrors.length).toBe(0);
    expect(results.resolveDiagnostics.length > 0).toBe(true);

    for (const [error, location] of zip(results.resolveDiagnostics, usedLocations)) {
      expect(DiagnosticSeverity.Warning).toBe(error.severity);
      expect(location.start).toEqual(error.range.start);
      expect(location.end).toEqual(error.range.end);
    }
  });

  const shadowPath = join(
    __dirname,
    '../../../kerboscripts/parser_valid/unitTests/shadowtest.ks',
  );

  const shadowedLocations: Range[] = [
    { start: new Marker(4, 10), end: new Marker(4, 11) },
  ];

  // test shadowing
  test('basic shadowed test', () => {
    const shadowedSource = readFileSync(shadowPath, 'utf8');
    const results = resolveSource(shadowedSource);

    expect(results.scan.scanErrors.length).toBe(0);
    expect(results.parse.parseErrors.length).toBe(0);
    expect(results.resolveDiagnostics.length > 0).toBe(true);

    for (const [error, location] of zip(results.resolveDiagnostics, shadowedLocations)) {
      expect(DiagnosticSeverity.Warning).toBe(error.severity);
      expect(location.start).toEqual(error.range.start);
      expect(location.end).toEqual(error.range.end);
    }
  });

  const deferredPath = join(
    __dirname,
    '../../../kerboscripts/parser_valid/unitTests/deferredtest.ks',
  );

  const deferredLocations: Range[] = [
    { start: new Marker(3, 10), end: new Marker(3, 11) },
    { start: new Marker(4, 10), end: new Marker(4, 11) },
    { start: new Marker(7, 3), end: new Marker(7, 4) },
    { start: new Marker(8, 10), end: new Marker(8, 11) },
    { start: new Marker(16, 14), end: new Marker(16, 15) },
  ];

  // test deferred resolving
  test('basic deferred test', () => {
    const deferredSource = readFileSync(deferredPath, 'utf8');
    const results = resolveSource(deferredSource);

    expect(results.scan.scanErrors.length).toBe(0);
    expect(results.parse.parseErrors.length).toBe(0);
    expect(results.resolveDiagnostics.length > 0).toBe(true);

    for (const [error, location] of zip(results.resolveDiagnostics, deferredLocations)) {
      expect(error.severity).toBe(DiagnosticSeverity.Hint);
      expect(location.start).toEqual(error.range.start);
      expect(location.end).toEqual(error.range.end);
    }
  });
});

const emptyFunction = `
function empty { }
`;

const returnFunction = `
function returning {
  return 10.
}
`;

const complicatedFunction = `
function complicated {
  parameter first.
  parameter x, y, other is 10.

  if x < 10 {
    return other.
  }

  local total is 0.
  for i in y {
    for j in first {
      set total to total + other + j.

      if total > 1e3 {
        return total.
      }
    }
  }

  local function inner {
    parameter a.
    print(a).

    return a.
  }

  return 10.
}
`;

describe('Function Scan', () => {
  test('empty function', () => {
    const parseResult = parseSource(emptyFunction);
    noParseErrors(parseResult);

    const { script } = parseResult.parse;
    expect(script.insts.length).toBe(1);

    const [funcInst] = script.insts;
    expect(funcInst).toBeInstanceOf(Decl.Func);

    const funcScanner = new FunctionScan();

    if (funcInst instanceof Decl.Func) {
      const scanResult = funcScanner.scan(funcInst.block);
      expect(scanResult).not.toBeUndefined();

      if (!empty(scanResult)) {
        expect(scanResult.return).toBe(false);
        expect(scanResult.requiredParameters).toBe(0);
        expect(scanResult.optionalParameters).toBe(0);
      }
    }
  });

  test('returning function', () => {
    const parseResult = parseSource(returnFunction);
    noParseErrors(parseResult);

    const { script } = parseResult.parse;
    expect(script.insts.length).toBe(1);

    const [funcInst] = script.insts;
    expect(funcInst).toBeInstanceOf(Decl.Func);

    const funcScanner = new FunctionScan();

    if (funcInst instanceof Decl.Func) {
      const scanResult = funcScanner.scan(funcInst.block);
      expect(scanResult).not.toBeUndefined();

      if (!empty(scanResult)) {
        expect(scanResult.return).toBe(true);
        expect(scanResult.requiredParameters).toBe(0);
        expect(scanResult.optionalParameters).toBe(0);
      }
    }
  });

  test('complicated function', () => {
    const parseResult = parseSource(complicatedFunction);
    noParseErrors(parseResult);

    const { script } = parseResult.parse;
    expect(script.insts.length).toBe(1);

    const [funcInst] = script.insts;
    expect(funcInst).toBeInstanceOf(Decl.Func);

    const funcScanner = new FunctionScan();

    if (funcInst instanceof Decl.Func) {
      const scanResult = funcScanner.scan(funcInst.block);
      expect(scanResult).not.toBeUndefined();

      if (!empty(scanResult)) {
        expect(scanResult.return).toBe(true);
        expect(scanResult.requiredParameters).toBe(3);
        expect(scanResult.optionalParameters).toBe(1);
      }
    }
  });
});
