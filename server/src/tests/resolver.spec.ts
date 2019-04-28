import * as expect from 'expect';
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
import { FuncResolver } from '../analysis/functionResolver';
import { KsSymbol, KsSymbolKind, IKsSymbolTracker } from '../analysis/types';
import { Resolver } from '../analysis/resolver';
import { standardLibrary } from '../analysis/standardLibrary';

const fakeUri = 'C:\\fake.ks';

interface IResolveResults {
  scan: IScanResult;
  parse: IParseResult;
  table: SymbolTable;
  resolveError: Diagnostic[];
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

  const functionResolver = new FuncResolver(result.parse.script, symbolTableBuilder);
  const resolver = new Resolver(result.parse.script, symbolTableBuilder);

  const funcResolverError = functionResolver.resolve();
  const resolverErrors = resolver.resolve();

  return {
    ...result,
    resolveError: funcResolverError.concat(resolverErrors),
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
    }
  };
};

const noErrors = (result: IResolveResults): void => {
  expect(result.scan.scanErrors.length).toBe(0);
  expect(result.parse.parseErrors.length).toBe(0);
  expect(result.resolveError.length).toBe(0);
};

const setSource = `
set x to 10.
set x to "cat".

set y to false.
set x to y.
print x.
`;


describe('Reolver tracking', () => {
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

      range =  makeRange(1, 16, 1, 20);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.function);
      expect(testTracker.usages.length).toBe(1);
    }

    // check param a
    const aParamTracker = table.scopedNamedTracker({ line: 2, character: 0 }, 'a');
    outOfScope = table.scopedNamedTracker(Position.create(0, 0), 'a');

    expect(outOfScope).toBeUndefined();
    expect(aParamTracker).not.toBeUndefined();
    if (aParamTracker !== undefined) {
      const { name, tag } = aParamTracker.declared.symbol;
      expect(name.lexeme).toBe('a');

      range =  makeRange(2, 14, 2, 15);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.parameter);
      expect(aParamTracker.usages.length).toBe(1);
    }

    // check param b
    const bParamTracker = table.scopedNamedTracker({ line: 2, character: 0 }, 'b');
    outOfScope = table.scopedNamedTracker(Position.create(0, 0), 'b');

    expect(outOfScope).toBeUndefined();
    expect(bParamTracker).not.toBeUndefined();
    if (bParamTracker !== undefined) {
      const { name, tag } = bParamTracker.declared.symbol;
      expect(name.lexeme).toBe('b');

      range =  makeRange(2, 17, 2, 18);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.parameter);
      expect(bParamTracker.usages.length).toBe(1);
    }

    // check loop i
    const iTracker = table.scopedNamedTracker({ line: 6, character: 0 }, 'i');
    outOfScope = table.scopedNamedTracker(Position.create(4, 0), 'i');

    expect(outOfScope).toBeUndefined();
    expect(iTracker).not.toBeUndefined();
    if (iTracker !== undefined) {
      const { name, tag } = iTracker.declared.symbol;
      expect(name.lexeme).toBe('i');

      range =  makeRange(5, 8, 5, 9);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.variable);
      expect(iTracker.usages.length).toBe(1);
    }

    // check loop i
    const xTracker = table.scopedNamedTracker({ line: 11, character: 0 }, 'x');
    outOfScope = table.scopedNamedTracker(Position.create(13, 0), 'x');

    expect(outOfScope).toBeUndefined();
    expect(xTracker).not.toBeUndefined();
    if (xTracker !== undefined) {
      const { name, tag } = xTracker.declared.symbol;
      expect(name.lexeme).toBe('x');

      range =  makeRange(9, 17, 9, 18);
      expect(rangeEqual(name, range)).toBeTruthy();
      expect(tag).toBe(KsSymbolKind.variable);
      expect(xTracker.usages.length).toBe(3);
    }
  });
})

describe('Resolver errors', () => {
  const definedPath = join(
    __dirname,
    '../../../kerboscripts/parser_valid/unitTests/definedtest.ks',
  );
  
  const definedLocations: Range[] = [
    { start: new Marker(5, 42), end: new Marker(5, 46) },
    { start: new Marker(8, 42), end: new Marker(8, 46) },
    { start: new Marker(24, 43), end: new Marker(24, 59) },
    { start: new Marker(30, 41), end: new Marker(30, 51) },
    { start: new Marker(31, 41), end: new Marker(31, 57) },
    { start: new Marker(49, 43), end: new Marker(49, 54) },
    { start: new Marker(53, 41), end: new Marker(53, 52) },
    { start: new Marker(54, 41), end: new Marker(54, 52) },
  ];
  
  // test basic identifier
  test('basic defined test', () => {
    const defineSource = readFileSync(definedPath, 'utf8');
    const results = resolveSource(defineSource);
  
    expect(0).toBe(results.scan.scanErrors.length);
    expect(0).toBe(results.parse.parseErrors.length);
    expect(results.resolveError.length > 0).toBe(true);
  
    for (const [error, location] of zip(results.resolveError, definedLocations)) {
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
    { start: new Marker(0, 6), end: new Marker(0, 7) },
    { start: new Marker(1, 6), end: new Marker(1, 7) },
  ];
  
  // test basic identifier
  test('basic used test', () => {
    const usedSource = readFileSync(usedPath, 'utf8');
    const results = resolveSource(usedSource);
  
    expect(0).toBe(results.scan.scanErrors.length);
    expect(0).toBe(results.parse.parseErrors.length);
    expect(results.resolveError.length > 0).toBe(true);
  
    for (const [error, location] of zip(results.resolveError, usedLocations)) {
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
    { start: new Marker(3, 10), end: new Marker(3, 11) },
  ];
  
  // test basic identifier
  test('basic shadowed test', () => {
    const shadowedSource = readFileSync(shadowPath, 'utf8');
    const results = resolveSource(shadowedSource);
  
    expect(0).toBe(results.scan.scanErrors.length);
    expect(0).toBe(results.parse.parseErrors.length);
    expect(results.resolveError.length > 0).toBe(true);
  
    for (const [error, location] of zip(results.resolveError, shadowedLocations)) {
      expect(DiagnosticSeverity.Warning).toBe(error.severity);
      expect(location.start).toEqual(error.range.start);
      expect(location.end).toEqual(error.range.end);
    }
  });
})
