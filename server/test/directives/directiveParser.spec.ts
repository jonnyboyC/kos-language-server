import { scanSource } from '../utilities/setup';
import { directiveParser } from '../../src/directives/directiveParser';

describe('parse directives', () => {
  describe('#include', () => {
    it('parses an include', () => {
      const result = scanSource('// #include "blah.ks"');

      expect(result.tokens).toHaveLength(0);
      expect(result.diagnostics).toHaveLength(0);
      expect(result.directiveTokens).toHaveLength(1);

      const directives = directiveParser(result.directiveTokens);
      expect(directives.diagnostics).toHaveLength(0);

      expect(directives.directives.include).toHaveLength(1);
      expect(directives.directives.region).toHaveLength(0);
      expect(directives.directives.endRegion).toHaveLength(0);
    });
  });

  describe('#region', () => {
    it('parses a region', () => {
      const result = scanSource('// #region');

      expect(result.tokens).toHaveLength(0);
      expect(result.diagnostics).toHaveLength(0);
      expect(result.directiveTokens).toHaveLength(1);

      const directives = directiveParser(result.directiveTokens);
      expect(directives.diagnostics).toHaveLength(0);

      expect(directives.directives.include).toHaveLength(0);
      expect(directives.directives.region).toHaveLength(1);
      expect(directives.directives.endRegion).toHaveLength(0);
    });
  });

  describe('#endregion', () => {
    it('parses an endregion', () => {
      const result = scanSource('// #endregion');

      expect(result.tokens).toHaveLength(0);
      expect(result.diagnostics).toHaveLength(0);
      expect(result.directiveTokens).toHaveLength(1);

      const directives = directiveParser(result.directiveTokens);
      expect(directives.diagnostics).toHaveLength(0);

      expect(directives.directives.include).toHaveLength(0);
      expect(directives.directives.region).toHaveLength(0);
      expect(directives.directives.endRegion).toHaveLength(1);
    });
  });
});
