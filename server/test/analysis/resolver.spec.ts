import { empty, unWrap, unWrapMany } from '../../src/utilities/typeGuards';
import {
  rangeEqual,
  rangeOrder,
  rangeBefore,
} from '../../src/utilities/positionUtils';
import { Range, DiagnosticSeverity, Position } from 'vscode-languageserver';
import { structureType } from '../../src/typeChecker/ksTypes/primitives/structure';
import { readFileSync } from 'fs';
import { join } from 'path';
import { zip } from '../../src/utilities/arrayUtils';
import {
  KsSymbolKind,
  SymbolTrackerBase,
  KsBaseSymbol,
} from '../../src/analysis/types';
import { Marker } from '../../src/scanner/models/marker';
import {
  noParseErrors,
  resolveSource,
  noResolverErrors,
} from '../utilities/setup';

const fakeUri = 'C:\\fake.ks';
const unitTestPath = join(
  __dirname,
  '../../../kerboscripts/parser_valid/unitTests',
);

// const resolveSource = (
//   source: string,
//   standardLib = false,
// ): IResolveResults => {
//   const result = parseSource(source);

//   const symbolTableBuilder = new SymbolTableBuilder(fakeUri);

//   if (standardLib) {
//     symbolTableBuilder.linkDependency(
//       standardLibraryBuilder(CaseKind.lowerCase),
//     );
//   }

//   const functionResolver = new PreResolver(
//     result.parse.script,
//     symbolTableBuilder,
//   );
//   const resolver = new Resolver(result.parse.script, symbolTableBuilder);

//   const preResolverError = functionResolver.resolve();
//   const resolverErrors = resolver.resolve();
//   const unusedErrors = symbolTableBuilder.findUnused();

//   return {
//     ...result,
//     resolveDiagnostics: preResolverError.concat(resolverErrors, unusedErrors),
//     table: symbolTableBuilder.build(),
//   };
// };

const makeRange = (
  sLine: number,
  sChar: number,
  eLine: number,
  eChar: number,
): Range => {
  return {
    start: {
      line: sLine,
      character: sChar,
    },
    end: {
      line: eLine,
      character: eChar,
    },
  };
};

// const noErrors = (result: IResolveResults): void => {
//   expect(result.scan.scanDiagnostics.map(e => e.message)).toEqual([]);
//   expect(result.parse.parseDiagnostics.map(e => e.message)).toEqual([]);
//   expect(result.resolveDiagnostics.map(e => e.message)).toEqual([]);
// };

const setSource = `
set x to 10.
set x to "cat".

set y to false.
set x to y.
print x.
`;

const lazyListSource = `
function example {
  parameter y.
  list files in y.
  print y.
}

list files in x.
print x.
`;

const localFunctionSource = `
from { local x is 0. } until x > 10 step { set x to x + 1. } do {
  local function example {
    print("hi").
  }
  example().
}
`;

const listSource = `
@lazyglobal off.
list files in x.
`;

describe('resolver', () => {
  describe('Resolver tracking', () => {
    // test basic identifier
    test('basic set test', () => {
      const results = resolveSource(setSource);
      noResolverErrors(results);

      const { table } = results;
      const symbols = table.allSymbols();
      const names = new Map(
        symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
      );

      expect(names.has('x')).toBe(true);
      expect(names.has('y')).toBe(true);

      const x = names.get('x');
      const y = names.get('y');

      expect(x).toBeDefined();
      expect(y).toBeDefined();

      expect(x!.name.lexeme).toBe('x');
      expect(y!.name.lexeme).toBe('y');

      expect(x!.tag).toBe(KsSymbolKind.variable);
      expect(y!.tag).toBe(KsSymbolKind.variable);
    });

    // test basic identifier
    test('basic tracker set test', () => {
      const results = resolveSource(setSource);
      noResolverErrors(results);

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
      expect(x.sets).toHaveLength(2);
      expect(y.sets).toHaveLength(0);

      // check the tracked set properties
      expect(x.usages).toHaveLength(1);
      expect(y.usages).toHaveLength(1);

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
    });

    test('lazy list test', () => {
      const results = resolveSource(lazyListSource);
      noResolverErrors(results);

      const { table } = results;
      const symbols = table.allSymbols();
      const names = new Map(
        symbols.map((s): [string, KsBaseSymbol] => [s.name.lexeme, s]),
      );

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

    const symbolKindPath = join(unitTestPath, 'scannertest.ks');

    // test basic identifier
    test('symbol kind', () => {
      const symbolKindSource = readFileSync(symbolKindPath, 'utf8');
      const results = resolveSource(symbolKindSource, undefined, true);
      noResolverErrors(results);

      let outOfScope: Maybe<SymbolTrackerBase>;
      let range: Range;

      const { table } = results;
      const testTracker = table.scopedNamedTracker(
        { line: 0, character: 0 },
        'test',
      );

      // check test function
      expect(testTracker).toBeDefined();
      if (testTracker !== undefined) {
        const { name, tag } = testTracker.declared.symbol;
        expect(name.lexeme).toBe('test');

        range = makeRange(3, 16, 3, 20);
        expect(rangeEqual(name, range)).toBe(true);
        expect(tag).toBe(KsSymbolKind.function);
        expect(testTracker.usages).toHaveLength(1);
        expect(testTracker.sets).toHaveLength(0);
      }

      // check param a
      const aParamTracker = table.scopedNamedTracker(
        { line: 4, character: 0 },
        'a',
      );
      outOfScope = table.scopedNamedTracker(Position.create(0, 0), 'a');

      expect(outOfScope).toBeUndefined();
      expect(aParamTracker).toBeDefined();
      if (aParamTracker !== undefined) {
        const { name, tag } = aParamTracker.declared.symbol;
        expect(name.lexeme).toBe('a');

        range = makeRange(4, 14, 4, 15);
        expect(rangeEqual(name, range)).toBeTruthy();
        expect(tag).toBe(KsSymbolKind.parameter);
        expect(aParamTracker.usages).toHaveLength(1);
        expect(aParamTracker.sets).toHaveLength(0);
      }

      // check param b
      const bParamTracker = table.scopedNamedTracker(
        { line: 4, character: 0 },
        'b',
      );
      outOfScope = table.scopedNamedTracker(Position.create(0, 0), 'b');

      expect(outOfScope).toBeUndefined();
      expect(bParamTracker).toBeDefined();
      if (bParamTracker !== undefined) {
        const { name, tag } = bParamTracker.declared.symbol;
        expect(name.lexeme).toBe('b');

        range = makeRange(4, 17, 4, 18);
        expect(rangeEqual(name, range)).toBeTruthy();
        expect(tag).toBe(KsSymbolKind.parameter);
        expect(bParamTracker.usages).toHaveLength(1);
        expect(bParamTracker.sets).toHaveLength(0);
      }

      // check loop i
      const iTracker = table.scopedNamedTracker({ line: 8, character: 0 }, 'i');
      outOfScope = table.scopedNamedTracker(Position.create(6, 0), 'i');

      expect(outOfScope).toBeUndefined();
      expect(iTracker).toBeDefined();
      if (iTracker !== undefined) {
        const { name, tag } = iTracker.declared.symbol;
        expect(name.lexeme).toBe('i');

        range = makeRange(7, 8, 7, 9);
        expect(rangeEqual(name, range)).toBeTruthy();
        expect(tag).toBe(KsSymbolKind.variable);
        expect(iTracker.usages).toHaveLength(1);
        expect(iTracker.sets).toHaveLength(0);
      }

      // check loop x
      const xTracker = table.scopedNamedTracker(
        { line: 13, character: 0 },
        'x',
      );
      outOfScope = table.scopedNamedTracker(Position.create(15, 0), 'x');

      expect(outOfScope).toBeUndefined();
      expect(xTracker).toBeDefined();
      if (xTracker !== undefined) {
        const { name, tag } = xTracker.declared.symbol;
        expect(name.lexeme).toBe('x');

        range = makeRange(11, 17, 11, 18);
        expect(rangeEqual(name, range)).toBeTruthy();
        expect(tag).toBe(KsSymbolKind.variable);
        expect(xTracker.usages).toHaveLength(3);
        expect(xTracker.sets).toHaveLength(1);
      }

      // check t lock
      const tTracker = table.scopedNamedTracker(
        { line: 16, character: 0 },
        't',
      );

      expect(tTracker).toBeDefined();
      if (tTracker !== undefined) {
        const { name, tag } = tTracker.declared.symbol;
        expect(name.lexeme).toBe('t');

        range = makeRange(17, 5, 17, 6);
        expect(rangeEqual(name, range)).toBeTruthy();
        expect(tag).toBe(KsSymbolKind.lock);
        expect(tTracker.usages).toHaveLength(1);
        expect(tTracker.sets).toHaveLength(0);
      }
    });

    const allNodePath = join(unitTestPath, 'allLanguage.ks');

    const allNodeLocations: Range[] = [
      { start: new Marker(8, 4), end: new Marker(8, 35) },
      { start: new Marker(9, 4), end: new Marker(9, 48) },
      { start: new Marker(10, 4), end: new Marker(10, 30) },
    ];

    test('all tree nodes', () => {
      const symbolKindSource = readFileSync(allNodePath, 'utf8');
      const results = resolveSource(symbolKindSource, undefined, true);
      noParseErrors(results);
      expect(results.resolveDiagnostics).toHaveLength(allNodeLocations.length);

      // spot each deprecated error
      for (const [error, location] of zip(
        results.resolveDiagnostics,
        allNodeLocations,
      )) {
        expect(DiagnosticSeverity.Warning).toBe(error.severity);
        expect(location.start).toEqual(error.range.start);
        expect(location.end).toEqual(error.range.end);
      }

      const { table } = results;
      const shipTracker = table.scopedNamedTracker(
        { line: 0, character: 0 },
        'ship',
      );

      // check test function
      expect(shipTracker).toBeDefined();
      if (shipTracker !== undefined) {
        const { name, tag } = shipTracker.declared.symbol;
        expect(name.lexeme).toBe('ship');

        expect(tag).toBe(KsSymbolKind.variable);
        expect(shipTracker.usages).toHaveLength(5);
        expect(shipTracker.sets).toHaveLength(0);
      }

      const bodyTracker = table.scopedNamedTracker(
        { line: 0, character: 0 },
        'body',
      );

      // check test function
      expect(bodyTracker).toBeDefined();
      if (bodyTracker !== undefined) {
        const { name, tag } = bodyTracker.declared.symbol;
        expect(name.lexeme).toBe('body');

        expect(tag).toBe(KsSymbolKind.variable);
        expect(bodyTracker.usages).toHaveLength(3);
        expect(bodyTracker.sets).toHaveLength(0);
      }

      const funcTracker = table.scopedNamedTracker(
        { line: 0, character: 0 },
        'func',
      );

      // check test function
      expect(funcTracker).toBeDefined();
      if (funcTracker !== undefined) {
        const { name, tag } = funcTracker.declared.symbol;
        expect(name.lexeme).toBe('func');

        expect(tag).toBe(KsSymbolKind.function);
        expect(funcTracker.usages).toHaveLength(1);
        expect(funcTracker.sets).toHaveLength(0);
      }

      const otherTracker = table.scopedNamedTracker(
        { line: 0, character: 0 },
        'other',
      );

      // check test function
      expect(otherTracker).toBeDefined();
      if (otherTracker !== undefined) {
        const { name, tag } = otherTracker.declared.symbol;
        expect(name.lexeme).toBe('other');

        expect(tag).toBe(KsSymbolKind.lock);
        expect(otherTracker.usages).toHaveLength(1);
        expect(otherTracker.sets).toHaveLength(0);
      }
    });

    test('local function', () => {
      const results = resolveSource(localFunctionSource, undefined, true);
      noResolverErrors(results);

      const { table } = results;
      const xTrack = table.scopedNamedTracker({ line: 2, character: 0 }, 'x');
      const exampleTrack = table.scopedNamedTracker(
        { line: 2, character: 0 },
        'example',
      );

      expect(xTrack).toBeDefined();
      expect(exampleTrack).toBeDefined();

      const [x, example] = unWrapMany(xTrack, exampleTrack);

      const xRange: Range = {
        start: { line: 1, character: 13 },
        end: { line: 1, character: 14 },
      };
      const exampleRange: Range = {
        start: { line: 2, character: 17 },
        end: { line: 2, character: 24 },
      };

      expect(rangeEqual(x.declared.range, xRange)).toBe(true);
      expect(rangeEqual(example.declared.range, exampleRange)).toBe(true);

      // check the tracked declared properties
      expect(x.declared.uri).toBe(fakeUri);
      expect(example.declared.uri).toBe(fakeUri);

      // should only be structure as it is the default placeholder
      expect(x.declared.type).toBe(structureType);
      expect(example.declared.type).toBe(structureType);

      expect(x.declared.symbol.name.lexeme).toBe('x');
      expect(example.declared.symbol.name.lexeme).toBe('example');

      expect(x.declared.symbol.tag).toBe(KsSymbolKind.variable);
      expect(example.declared.symbol.tag).toBe(KsSymbolKind.function);

      // check the tracked set properties
      expect(x.sets).toHaveLength(1);
      expect(example.sets).toHaveLength(0);

      // check the tracked set properties
      expect(x.usages).toHaveLength(2);
      expect(example.usages).toHaveLength(1);

      expect(
        table.scopedNamedTracker({ line: 1, character: 15 }, 'x'),
      ).toBeDefined();
      expect(
        table.scopedNamedTracker({ line: 1, character: 15 }, 'example'),
      ).toBeUndefined();

      expect(
        table.scopedNamedTracker({ line: 0, character: 0 }, 'x'),
      ).toBeUndefined();
      expect(
        table.scopedNamedTracker({ line: 0, character: 0 }, 'example'),
      ).toBeUndefined();
    });
  });

  describe('Resolver errors', () => {
    const listLocations: Range[] = [
      { start: new Marker(2, 14), end: new Marker(2, 15) },
    ];

    // test basic identifier
    test('list command', () => {
      const results = resolveSource(listSource);

      expect(results.scan.diagnostics).toHaveLength(0);
      expect(results.parse.diagnostics).toHaveLength(0);
      expect(results.resolveDiagnostics).toHaveLength(listLocations.length);

      for (const [error, location] of zip(
        results.resolveDiagnostics,
        listLocations,
      )) {
        expect(DiagnosticSeverity.Error).toBe(error.severity);
        expect(location.start).toEqual(error.range.start);
        expect(location.end).toEqual(error.range.end);
      }
    });

    const definedPath = join(unitTestPath, 'definedtest.ks');

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
    test('defined command', () => {
      const defineSource = readFileSync(definedPath, 'utf8');
      const results = resolveSource(defineSource);

      expect(results.scan.diagnostics).toHaveLength(0);
      expect(results.parse.diagnostics).toHaveLength(0);
      expect(results.resolveDiagnostics).toHaveLength(definedLocations.length);

      const sortedErrors = results.resolveDiagnostics.sort(
        (a, b) => a.range.start.line - b.range.start.line,
      );

      for (const [error, location] of zip(sortedErrors, definedLocations)) {
        expect(error.severity).toBe(DiagnosticSeverity.Warning);
        expect(location.start).toEqual(error.range.start);
        expect(location.end).toEqual(error.range.end);
      }
    });

    const usedPath = join(unitTestPath, 'usedtest.ks');

    const usedLocations: Range[] = [
      { start: new Marker(1, 6), end: new Marker(1, 7) },
      { start: new Marker(2, 6), end: new Marker(2, 7) },
    ];

    // test basic identifier
    test('used symbols', () => {
      const usedSource = readFileSync(usedPath, 'utf8');
      const results = resolveSource(usedSource);

      expect(results.scan.diagnostics).toHaveLength(0);
      expect(results.parse.diagnostics).toHaveLength(0);
      expect(results.resolveDiagnostics.length > 0).toBe(true);

      for (const [error, location] of zip(
        results.resolveDiagnostics,
        usedLocations,
      )) {
        expect(DiagnosticSeverity.Warning).toBe(error.severity);
        expect(location.start).toEqual(error.range.start);
        expect(location.end).toEqual(error.range.end);
      }
    });

    // test shadowing
    describe('shadowed symbols', () => {
      const shadowPath = join(unitTestPath, 'shadow', 'shadowtest.ks');
      const shadowLibPath = join(unitTestPath, 'shadow', 'shadowLib.ks');
      const shadowSrcPath = join(unitTestPath, 'shadow', 'shadowSrc.ks');

      const shadowedLocalLocations: Range[] = [
        { start: new Marker(4, 10), end: new Marker(4, 11) },
      ];

      test('same file', () => {
        const shadowedSource = readFileSync(shadowPath, 'utf8');
        const results = resolveSource(shadowedSource, undefined, true);

        expect(results.scan.diagnostics).toHaveLength(0);
        expect(results.parse.diagnostics).toHaveLength(0);

        expect(results.resolveDiagnostics).toHaveLength(
          shadowedLocalLocations.length,
        );

        for (const [error, location] of zip(
          results.resolveDiagnostics,
          shadowedLocalLocations,
        )) {
          expect(DiagnosticSeverity.Hint).toBe(error.severity);
          expect(location.start).toEqual(error.range.start);
          expect(location.end).toEqual(error.range.end);
        }
      });

      const shadowedDifferentLocations: [Range, Range][] = [
        [
          { start: new Marker(2, 15), end: new Marker(2, 19) },
          { start: new Marker(1, 9), end: new Marker(1, 13) },
        ],
        [
          { start: new Marker(3, 12), end: new Marker(3, 17) },
          { start: new Marker(4, 7), end: new Marker(4, 12) },
        ],
        // TODO lock
        [
          { start: new Marker(7, 6), end: new Marker(7, 9) },
          { start: new Marker(3, 7), end: new Marker(3, 10) },
        ],
      ];

      test('different files', () => {
        const libSource = readFileSync(shadowLibPath, 'utf8');
        const srcSource = readFileSync(shadowSrcPath, 'utf8');

        const srcUri = '/example/src.ks';
        const libUri = '/example/lib.ks';

        const { table: libTable } = resolveSource(libSource, libUri, true);

        const { scan, parse, resolveDiagnostics } = resolveSource(
          srcSource,
          srcUri,
          true,
          libTable,
        );

        const sorted = resolveDiagnostics.sort((a, b) =>
          rangeBefore(a.range, b.range.start) ? -1 : 1,
        );

        expect(scan.diagnostics).toHaveLength(0);
        expect(parse.diagnostics).toHaveLength(0);
        expect(resolveDiagnostics).toHaveLength(
          shadowedDifferentLocations.length,
        );
        noParseErrors({ scan, parse });
        for (const [error, [local, lib]] of zip(
          sorted,
          shadowedDifferentLocations,
        )) {
          expect(error.severity).toBe(DiagnosticSeverity.Hint);
          expect(error.range.start).toEqual(local.start);
          expect(error.range.end).toEqual(local.end);

          expect(error.relatedInformation).toBeDefined();
          expect(error.relatedInformation).toHaveLength(1);
          expect(error.relatedInformation![0].location.uri).toBe(libUri);
          expect(error.relatedInformation![0].location.range.start).toEqual(
            lib.start,
          );
          expect(error.relatedInformation![0].location.range.end).toEqual(
            lib.end,
          );
        }
      });
    });

    const deferredPath = join(unitTestPath, 'deferredtest.ks');

    const deferredLocations: Range[] = [
      { start: new Marker(3, 10), end: new Marker(3, 11) },
      { start: new Marker(4, 10), end: new Marker(4, 11) },
      { start: new Marker(7, 3), end: new Marker(7, 4) },
      { start: new Marker(8, 10), end: new Marker(8, 11) },
      { start: new Marker(16, 14), end: new Marker(16, 15) },
    ];

    // test deferred resolving
    test('deferred nodes', () => {
      const deferredSource = readFileSync(deferredPath, 'utf8');
      const results = resolveSource(deferredSource);

      expect(results.scan.diagnostics).toHaveLength(0);
      expect(results.parse.diagnostics).toHaveLength(0);
      expect(results.resolveDiagnostics.length > 0).toBe(true);

      for (const [error, location] of zip(
        results.resolveDiagnostics,
        deferredLocations,
      )) {
        expect(error.severity).toBe(DiagnosticSeverity.Hint);
        expect(location.start).toEqual(error.range.start);
        expect(location.end).toEqual(error.range.end);
      }
    });

    const breakPath = join(unitTestPath, 'breaktest.ks');

    const breakLocations: Range[] = [
      { start: new Marker(9, 0), end: new Marker(9, 5) },
      { start: new Marker(21, 0), end: new Marker(21, 5) },
    ];

    // invalid break locations
    test('break locations', () => {
      const deferredSource = readFileSync(breakPath, 'utf8');
      const results = resolveSource(deferredSource);

      expect(results.scan.diagnostics).toHaveLength(0);
      expect(results.parse.diagnostics).toHaveLength(0);
      expect(results.resolveDiagnostics.length > 0).toBe(true);

      for (const [error, location] of zip(
        results.resolveDiagnostics,
        breakLocations,
      )) {
        expect(error.severity).toBe(DiagnosticSeverity.Error);
        expect(location.start).toEqual(error.range.start);
        expect(location.end).toEqual(error.range.end);
      }
    });

    const returnPath = join(unitTestPath, 'returntest.ks');

    const returnLocations: Range[] = [
      { start: new Marker(24, 4), end: new Marker(24, 10) },
      { start: new Marker(27, 0), end: new Marker(27, 6) },
    ];

    // invalid return locations
    test('return locations', () => {
      const returnSource = readFileSync(returnPath, 'utf8');
      const results = resolveSource(returnSource);

      expect(results.scan.diagnostics).toHaveLength(0);
      expect(results.parse.diagnostics).toHaveLength(0);
      expect(results.resolveDiagnostics.length > 0).toBe(true);

      for (const [error, location] of zip(
        results.resolveDiagnostics,
        returnLocations,
      )) {
        expect(error.severity).toBe(DiagnosticSeverity.Error);
        expect(location.start).toEqual(error.range.start);
        expect(location.end).toEqual(error.range.end);
      }
    });

    const preservePath = join(unitTestPath, 'preservetest.ks');

    const preserveLocations: Range[] = [
      { start: new Marker(2, 4), end: new Marker(2, 12) },
      { start: new Marker(7, 4), end: new Marker(7, 12) },
      { start: new Marker(16, 4), end: new Marker(16, 12) },
      { start: new Marker(23, 0), end: new Marker(23, 8) },
    ];

    // invalid preserve locations
    test('preserve locations', () => {
      const preserveSource = readFileSync(preservePath, 'utf8');
      const results = resolveSource(preserveSource, undefined, true);

      expect(results.scan.diagnostics).toHaveLength(0);
      expect(results.parse.diagnostics).toHaveLength(0);
      expect(results.resolveDiagnostics.length > 0).toBe(true);

      const sorted = results.resolveDiagnostics.sort((a, b) =>
        rangeOrder(a.range, b.range),
      );

      for (const [error, location] of zip(sorted, preserveLocations)) {
        expect(error.severity).toBe(DiagnosticSeverity.Error);
        expect(location.start).toEqual(error.range.start);
        expect(location.end).toEqual(error.range.end);
      }
    });
  });
});
