import { LocalResolver } from '../../src/analysis/localResolver';
import { SetResolver } from '../../src/analysis/setResolver';
import * as Stmt from '../../src/parser/models/stmt';
import { empty } from '../../src/utilities/typeGuards';
import { parseSource, noParseErrors } from '../utilities/setup';

describe('Set Resolver', () => {
  test('set resolver test 1', () => {
    const source =
      'set Thing(fart):other[used1]:finally(used2, used3):planet to 10.';
    const result = parseSource(source);
    noParseErrors(result);

    const { script } = result.parse;
    const stmt = script.stmts[0];

    const local = new LocalResolver();
    const resolver = new SetResolver(local);
    if (stmt instanceof Stmt.Set) {
      const { used, set } = resolver.resolveExpr(stmt.suffix);
      expect(set).toBeDefined();
      if (!empty(set)) {
        expect(set.lexeme).toBe('Thing');
      }

      expect(used).toHaveLength(4);

      const [fart, used1, used2, used3] = used;
      expect(fart.lexeme).toBe('fart');
      expect(used1.lexeme).toBe('used1');
      expect(used2.lexeme).toBe('used2');
      expect(used3.lexeme).toBe('used3');
    } else {
      expect(true).toBeFalsy();
    }
  });
});
