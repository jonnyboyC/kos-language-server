import { levenshteinDistance } from '../../src/utilities/levenshtein';

describe('levenshtein distance', () => {
  describe('when the same string', () => {
    test('distance is 0', () => {
      const strings = ['cat', 'kerbals', 'space program', '∆∂∆∑ƒøˆ∆ø'];

      for (const string of strings) {
        expect(levenshteinDistance(string, string)).toBe(0);
      }
    });
  });

  describe('when a single character substitution', () => {
    test('distance is 1', () => {
      expect(levenshteinDistance('coat', 'boat')).toBe(1);
      expect(levenshteinDistance('defense', 'defence')).toBe(1);
    });
  });

  describe('when a single character insertion', () => {
    test('distance is 1', () => {
      expect(levenshteinDistance('cat', 'cats')).toBe(1);
      expect(levenshteinDistance('mo', 'mow')).toBe(1);
      expect(levenshteinDistance('space', 'spaces')).toBe(1);
    });
  });

  describe('when a single character deletion', () => {
    test('distance is 1', () => {
      expect(levenshteinDistance('cats', 'cat')).toBe(1);
      expect(levenshteinDistance('mow', 'mo')).toBe(1);
      expect(levenshteinDistance('spaces', 'space')).toBe(1);
    });
  });

  describe('when distance is a mix if differences', () => {
    test('calculates the correct value', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(levenshteinDistance('saturday', 'sunday')).toBe(3);
    });
  });

  describe('when case is different', () => {
    test('does not factor in case', () => {
      expect(levenshteinDistance('CAT', 'cAt')).toBe(0);
      expect(levenshteinDistance('mow', 'MO')).toBe(1);
      expect(levenshteinDistance('kiTTen', 'SItting')).toBe(3);
    });
  });
});
