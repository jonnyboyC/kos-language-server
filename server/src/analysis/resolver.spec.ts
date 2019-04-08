import { Parser } from '../parser/parser';
import { Scanner } from '../scanner/scanner';
import { IParseResult } from '../parser/types';
import ava, { ExecutionContext }from 'ava';
import { SymbolTable } from './symbolTable';
import { FuncResolver } from './functionResolver';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { Resolver } from './resolver';
import { KsSymbol, KsSymbolKind, IResolverError } from './types';
import { empty, unWrap, unWrapMany } from '../utilities/typeGuards';
import { rangeEqual } from '../utilities/positionHelpers';
import { Range } from 'vscode-languageserver';
import { structureType } from '../typeChecker/types/primitives/structure';
import { IScanResult } from '../scanner/types';
import { readFileSync } from 'fs';
import { join } from 'path';

const fakeUri = 'C:\\fake.ks';

interface IResolveResults {
  scan: IScanResult;
  parse: IParseResult;
  table: SymbolTable;
  resolveError: IResolverError[];
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

const noErrors = (result: IResolveResults, t: ExecutionContext<{}>): void => {
  t.is(0, result.scan.scanErrors.length);
  t.is(0, result.parse.parseErrors.length);
  t.is(0, result.resolveError.length);
};

const setSource = `
set x to 10.
set x to "cat".

set y to false.
set x to y.
print x.
`;

// test basic identifier
ava('basic set test', (t) => {
  const results = resolveSource(setSource);
  noErrors(results, t);

  const { table } = results;
  const symbols = table.fileSymbols();
  const names = new Map(symbols.map((s): [string, KsSymbol] => [s.name.lexeme, s]));

  t.true(names.has('x'));
  t.true(names.has('y'));

  const xWrap = names.get('x');
  const yWrap = names.get('y');

  t.false(empty(xWrap));
  t.false(empty(yWrap));

  const x = unWrap(xWrap);
  const y = unWrap(yWrap);

  t.is(x.name.lexeme, 'x');
  t.is(y.name.lexeme, 'y');

  t.is(x.tag, KsSymbolKind.variable);
  t.is(y.tag, KsSymbolKind.variable);
});

// test basic identifier
ava('basic tracker set test', (t) => {
  const results = resolveSource(setSource);
  noErrors(results, t);

  const { table } = results;
  const xTrack = table.scopedNamedTracker({ line: 0, character: 0 }, 'x');
  const yTrack = table.scopedNamedTracker({ line: 0, character: 0 }, 'y');

  t.false(empty(xTrack));
  t.false(empty(yTrack));

  const [x, y] = unWrapMany(xTrack, yTrack);

  const xRange: Range = {
    start: { line: 1, character: 4 },
    end: { line: 1, character: 5 },
  };
  const yRange: Range = {
    start: { line: 4, character: 4 },
    end: { line: 4, character: 5 },
  };

  t.true(rangeEqual(x.declared.range, xRange));
  t.true(rangeEqual(y.declared.range, yRange));

  // check the tracked declared properties
  t.is(x.declared.uri, fakeUri);
  t.is(y.declared.uri, fakeUri);

  // should only be structure as it is the default placeholder
  t.is(x.declared.type, structureType);
  t.is(y.declared.type, structureType);

  t.is(x.declared.symbol.name.lexeme, 'x');
  t.is(y.declared.symbol.name.lexeme, 'y');

  t.is(x.declared.symbol.tag, KsSymbolKind.variable);
  t.is(y.declared.symbol.tag, KsSymbolKind.variable);

  // check the tracked set properties
  // resolver doesn't track sets
  t.is(x.sets.length, 0);
  t.is(y.sets.length, 0);

  // check the tracked set properties
  t.is(x.usages.length, 1);
  t.is(y.usages.length, 1);

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

  t.true(rangeEqual(xUsage.range, xUsageRange));
  t.true(rangeEqual(yUsage.range, yUsageRange));

  t.is(xUsage.uri, fakeUri);
  t.is(yUsage.uri, fakeUri);

  t.is(xUsage.type, structureType);
  t.is(yUsage.type, structureType);
});

const definedPath = join(
  __dirname,
  '../../../kerboscripts/parser_valid/declaration/definedtest.ks',
);

// test basic identifier
ava('basic defined test', (t) => {
  const defineSource = readFileSync(definedPath, 'utf8');
  const results = resolveSource(defineSource);

  t.is(0, results.scan.scanErrors.length);
  t.is(0, results.parse.parseErrors.length);
  t.true(results.resolveError.length > 0);
});
