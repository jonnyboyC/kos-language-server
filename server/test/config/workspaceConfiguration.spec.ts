import { WorkspaceConfiguration } from '../../src/config/workspaceConfiguration';
import { LintRule } from '../../src/config/lintRules';
import { DIAGNOSTICS } from '../../src/utilities/diagnosticsUtils';

describe('WorkspaceConfiguration', () => {
  describe('When constructing an instance', () => {
    test('It has the appropriate properties', () => {
      const rootVolume = 'example';
      const bodies = ['Mun', 'Kerbin'];
      const lintRules = new Map([
        [
          'load-error',
          new LintRule('load-error', 'info', [DIAGNOSTICS.LOAD_ERROR], []),
        ],
      ]);

      const configuration = new WorkspaceConfiguration(
        rootVolume,
        bodies,
        lintRules,
      );
      expect(configuration.rootVolume).toBe(rootVolume);
      expect(configuration.bodies).toBe(bodies);
      expect(configuration.lintRules).toBe(lintRules);
    });

    describe('When empty', () => {
      test('It is empty', () => {
        const configuration = new WorkspaceConfiguration();
        expect(configuration.rootVolume).toBeUndefined();
        expect(configuration.bodies).toBeUndefined();
        expect(configuration.lintRules).toBeUndefined();
      });
    });
  });

  describe('When merging configuration', () => {
    describe('When merging root volumes', () => {
      test('it merges correctly', () => {
        const rootVolume1 = 'root';
        const rootVolume2 = 'otherRoot';
        const configEmpty = new WorkspaceConfiguration();
        const config1 = new WorkspaceConfiguration(rootVolume1);
        const config2 = new WorkspaceConfiguration(rootVolume2);
        expect(configEmpty.merge(configEmpty).rootVolume).toBe(undefined);
        expect(config1.merge(configEmpty).rootVolume).toBe(rootVolume1);
        expect(configEmpty.merge(config1).rootVolume).toBe(rootVolume1);
        expect(config1.merge(config2).rootVolume).toBe(rootVolume2);
      });
    });
    describe('When merging bodies', () => {
      test('it merges correctly', () => {
        const bodies1 = ['Earth', 'Mars'];
        const bodies2 = ['Kerbin', 'Duna'];
        const configEmpty = new WorkspaceConfiguration();
        const config1 = new WorkspaceConfiguration(undefined, bodies1);
        const config2 = new WorkspaceConfiguration(undefined, bodies2);
        expect(configEmpty.merge(configEmpty).bodies).toBe(undefined);
        expect(config1.merge(configEmpty).bodies).toBe(bodies1);
        expect(configEmpty.merge(config1).bodies).toBe(bodies1);
        expect(config1.merge(config2).bodies).toBe(bodies2);
      });
    });
    describe('When merging lint rules', () => {
      test('it merges correctly', () => {
        const lint1 = new Map([
          [
            DIAGNOSTICS.UNREACHABLE_CODE,
            new LintRule(
              DIAGNOSTICS.UNREACHABLE_CODE,
              'info',
              [DIAGNOSTICS.UNREACHABLE_CODE],
              [],
            ),
          ],
        ]);
        const lint2 = new Map([
          [
            DIAGNOSTICS.UNREACHABLE_CODE,
            new LintRule(
              DIAGNOSTICS.UNREACHABLE_CODE,
              'error',
              [DIAGNOSTICS.UNREACHABLE_CODE],
              [],
            ),
          ],
          [
            DIAGNOSTICS.GLOBAL_PARAMETER,
            new LintRule(
              DIAGNOSTICS.GLOBAL_PARAMETER,
              'hint',
              [DIAGNOSTICS.GLOBAL_PARAMETER],
              [],
            ),
          ],
        ]);
        const configEmpty = new WorkspaceConfiguration();
        const config1 = new WorkspaceConfiguration(undefined, undefined, lint1);
        const config2 = new WorkspaceConfiguration(undefined, undefined, lint2);
        expect(configEmpty.merge(configEmpty).lintRules).toBe(undefined);
        expect(config1.merge(configEmpty).lintRules).toBe(lint1);
        expect(configEmpty.merge(config1).lintRules).toBe(lint1);
        expect(config2.merge(config1).lintRules).toEqual(
          new Map([
            [
              DIAGNOSTICS.UNREACHABLE_CODE,
              lint1.get(DIAGNOSTICS.UNREACHABLE_CODE),
            ],
            [
              DIAGNOSTICS.GLOBAL_PARAMETER,
              lint2.get(DIAGNOSTICS.GLOBAL_PARAMETER),
            ],
          ]),
        );
      });
    });
  });
});
