import { DiagnosticSeverity, Diagnostic, Range } from 'vscode-languageserver';
import { LintManager } from '../../src/config/lintManager';
import { LintRule } from '../../src/config/models/lintRules';
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
    describe('When no owning rules', () => {
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

        expect(filteredDiagnostics).toHaveLength(2);

        expect(filteredDiagnostics[0].message).toBe('example1');
        expect(filteredDiagnostics[0].severity).toBe(DiagnosticSeverity.Error);

        expect(filteredDiagnostics[1].message).toBe('example2');
        expect(filteredDiagnostics[1].severity).toBe(DiagnosticSeverity.Error);
      });
    });

    describe('When owning rules', () => {
      test('it altered correctly', () => {
        const lintChild1 = new LintRule(
          'example-rule2',
          'warning',
          [DIAGNOSTICS.INVALID_BREAK_CONTEXT],
          [],
        );
        const lintChile2 = new LintRule(
          'example-rule2',
          'off',
          [DIAGNOSTICS.UNREACHABLE_CODE],
          [],
        );
        const lintParent = new LintRule(
          'example-parent',
          'error',
          [DIAGNOSTICS.CANNOT_SET],
          [lintChild1, lintChile2],
        );

        debugger;
        const lintRules: LintRule[] = [lintChild1, lintChile2, lintParent];
        const lintManager = LintManager.fromRules(lintRules);

        const diagnostics: Diagnostic[] = [
          Diagnostic.create(
            dummyRange,
            'example1',
            DiagnosticSeverity.Hint,
            DIAGNOSTICS.INVALID_BREAK_CONTEXT,
          ),
          Diagnostic.create(
            dummyRange,
            'example2',
            DiagnosticSeverity.Warning,
            DIAGNOSTICS.UNREACHABLE_CODE,
          ),
          Diagnostic.create(
            dummyRange,
            'example3',
            DiagnosticSeverity.Error,
            DIAGNOSTICS.CANNOT_SET,
          ),
        ];

        const filteredDiagnostics = lintManager.apply(diagnostics);

        expect(filteredDiagnostics).toHaveLength(3);

        expect(filteredDiagnostics[0].message).toBe('example1');
        expect(filteredDiagnostics[0].severity).toBe(DiagnosticSeverity.Error);

        expect(filteredDiagnostics[1].message).toBe('example2');
        expect(filteredDiagnostics[1].severity).toBe(DiagnosticSeverity.Error);

        expect(filteredDiagnostics[2].message).toBe('example3');
        expect(filteredDiagnostics[2].severity).toBe(DiagnosticSeverity.Error);
      });
    });
  });
});
