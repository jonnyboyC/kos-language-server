import { Parser } from '../parser/parser';
import { Scanner } from '../scanner/scanner';
import { IScript } from '../parser/types';
import ava, { GenericTestContext, Context } from 'ava';
import { SymbolTable } from './symbolTable';
import { FuncResolver } from './functionResolver';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { Resolver } from './resolver';

const fakeUri = 'C:\\fake.ks';

// parse source
const parseSource = (source: string, t: GenericTestContext<Context<any>>): IScript => {
  const scanner = new Scanner(source, fakeUri);
  const { scanErrors, tokens } = scanner.scanTokens();
  t.is(0, scanErrors.length);

  const parser = new Parser(fakeUri, tokens);
  const { parseErrors, script } = parser.parse();
  t.is(0, parseErrors.length);

  return script;
};

const resolveSource = (source: string, t: GenericTestContext<Context<any>>): SymbolTable => {
  const script = parseSource(source, t);

  const symbolTableBuilder = new SymbolTableBuilder(fakeUri);
  const functionResolver = new FuncResolver(script, symbolTableBuilder);
  const resolver = new Resolver(script, symbolTableBuilder);

  const funcResolverError = functionResolver.resolve();
  t.is(0, funcResolverError.length);

  const resolverErrors = resolver.resolve();
  t.is(0, resolverErrors.length);

  return symbolTableBuilder.build();
};

const setSource = `
set x to 10.
set x to "cat".

set y to false.
set x to y.
`;

// test basic identifier
ava('basic set test', (t) => {
  const symbolTable = resolveSource(setSource, t);
  const symbols = symbolTable.fileSymbols();
  const names = new Set(symbols.map(s => s.name.lexeme));

  t.true(names.has('x'));
  t.true(names.has('y'));
});
