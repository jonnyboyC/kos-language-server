import { parseSource, noParseErrors } from '../utilities/setup';
import { LocalResolver } from '../../src/analysis/localResolver';
import * as Stmt from '../../src/parser/models/stmt';

describe('Local Resolver', () => {
  test('local resolver test 1', () => {
    const source = 'set a to Thing:other[used1]:finally(used2, used3).';
    const result = parseSource(source);
    noParseErrors(result);

    const { script } = result.parse;
    const stmt = script.stmts[0];

    const resolver = new LocalResolver();
    if (stmt instanceof Stmt.Set) {
      const resolverResult = resolver.resolveExpr(stmt.value);
      expect(resolverResult).toHaveLength(4);
      const [thing, used1, used2, used3] = resolverResult;

      expect(thing.lexeme).toBe('Thing');
      expect(used1.lexeme).toBe('used1');
      expect(used2.lexeme).toBe('used2');
      expect(used3.lexeme).toBe('used3');
    } else {
      expect(true).toBeFalsy();
    }
  });

  test('local resolver test 2', () => {
    const source =
      'set a to (first:suffix(nest:call(1), array["yo"]) ^ exponent) < example#3.';
    const result = parseSource(source);
    noParseErrors(result);

    const { script } = result.parse;
    const stmt = script.stmts[0];

    const resolver = new LocalResolver();
    if (stmt instanceof Stmt.Set) {
      const resolverResult = resolver.resolveExpr(stmt.value);
      expect(resolverResult).toHaveLength(5);
      const [first, nest, array, exponent, example] = resolverResult;

      expect(first.lexeme).toBe('first');
      expect(nest.lexeme).toBe('nest');
      expect(array.lexeme).toBe('array');
      expect(exponent.lexeme).toBe('exponent');
      expect(example.lexeme).toBe('example');
    } else {
      expect(true).toBeFalsy();
    }
  });
});
