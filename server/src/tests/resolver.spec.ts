import * as expect from 'expect';
import { Parser } from '../parser/parser';
import { Scanner } from '../scanner/scanner';
import { IParseResult } from '../parser/types';
import { empty, unWrap, unWrapMany } from '../utilities/typeGuards';
import { rangeEqual } from '../utilities/positionHelpers';
import { Range, Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { structureType } from '../typeChecker/types/primitives/structure';
import { IScanResult } from '../scanner/types';
import { readFileSync } from 'fs';
import { join } from 'path';
import { zip } from '../utilities/arrayUtilities';
import { Marker } from '../entities/token';
import { SymbolTable } from '../analysis/symbolTable';
import { SymbolTableBuilder } from '../analysis/symbolTableBuilder';
import { FuncResolver } from '../analysis/functionResolver';
import { KsSymbol, KsSymbolKind } from '../analysis/types';
import { Resolver } from '../analysis/resolver';

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

const resolveSource = (source: string): IResolveResults => {
  const result = parseSource(source);

  const symbolTableBuilder = new SymbolTableBuilder(fakeUri);
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

const noErrors = (result: IResolveResults): void => {
  expect(0).toBe(result.scan.scanErrors.length);
  expect(0).toBe(result.parse.parseErrors.length);
  expect(0).toBe(result.resolveError.length);
};

const setSource = `
set x to 10.
set x to "cat".

set y to false.
set x to y.
print x.
`;

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
