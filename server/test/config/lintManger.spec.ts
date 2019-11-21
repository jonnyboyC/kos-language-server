import { DiagnosticSeverity, Diagnostic, Range } from 'vscode-languageserver';
import { LintManager } from '../../src/config/lintManager';
import { LintRule } from '../../src/config/lintRules';
import { DIAGNOSTICS } from '../../src/utilities/diagnosticsUtils';

const dummyRange: Range = {
  start: {
    line: 0,
    character: 0,
  },
  end: {
    line: 0,
    character: 10,
  },
};

describe('LintManager', () => {
  describe('When constructing an instance', () => {
    test('It has the appropriate properties', () => {
      const severities = new Map<string, DiagnosticSeverity>([
        ['example1', DiagnosticSeverity.Hint],
        ['example2', DiagnosticSeverity.Error],
      ]);

      const lintManager = new LintManager(severities);
      expect(lintManager.severities).toBe(severities);
    });
  });

  describe('When constructing using the from rules static method', () => {
    test('It has the appropriate properties', () => {
      const lintRules: LintRule[] = [
        new LintRule('example-rule1', 'error', [DIAGNOSTICS.CANNOT_SET], []),
        new LintRule(
          'example-rule2',
          'hint',
          [DIAGNOSTICS.UNREACHABLE_CODE],
          [],
        ),
      ];

      const lintManager = LintManager.fromRules(lintRules);
      expect(lintManager.severities.get(DIAGNOSTICS.CANNOT_SET)).toBe(
        DiagnosticSeverity.Error,
      );
      expect(lintManager.severities.get(DIAGNOSTICS.UNREACHABLE_CODE)).toBe(
        DiagnosticSeverity.Hint,
      );
      expect(lintManager.severities.get('fake')).toBe(undefined);
    });
  });

  describe('When apply the manager to diagnostics', () => {
    test('it altered correctly', () => {
      const lintRules: LintRule[] = [
        new LintRule('example-rule1', 'error', [DIAGNOSTICS.CANNOT_SET], []),
        new LintRule(
          'example-rule2',
          'off',
          [DIAGNOSTICS.UNREACHABLE_CODE],
          [],
        ),
      ];

      const lintManager = LintManager.fromRules(lintRules);

      console.log(lintManager.severities.get(DIAGNOSTICS.CANNOT_SET));

      const diagnostics: Diagnostic[] = [
        Diagnostic.create(
          dummyRange,
          'example1',
          DiagnosticSeverity.Hint,
          DIAGNOSTICS.CANNOT_SET,
        ),
        Diagnostic.create(
          dummyRange,
          'example2',
          DiagnosticSeverity.Warning,
          DIAGNOSTICS.CANNOT_SET,
        ),
        Diagnostic.create(
          dummyRange,
          'example3',
          DiagnosticSeverity.Error,
          DIAGNOSTICS.UNREACHABLE_CODE,
        ),
      ];

      const filteredDiagnostics = lintManager.apply(diagnostics);

      console.log(filteredDiagnostics);
      expect(filteredDiagnostics).toHaveLength(2);

      expect(filteredDiagnostics[0].message).toBe('example1');
      expect(filteredDiagnostics[0].severity).toBe(DiagnosticSeverity.Error);

      expect(filteredDiagnostics[1].message).toBe('example2');
      expect(filteredDiagnostics[1].severity).toBe(DiagnosticSeverity.Error);
    });
  });
});
