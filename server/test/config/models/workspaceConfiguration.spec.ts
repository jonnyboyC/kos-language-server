import { WorkspaceConfiguration } from '../../../src/config/models/workspaceConfiguration';
import { LintRule } from '../../../src/config/models/lintRules';
import { DIAGNOSTICS } from '../../../src/utilities/diagnosticsUtils';
import { URI } from 'vscode-uri';
import { join } from 'path';

const configUri = URI.file(__filename);

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
        configUri,
        rootVolume,
        bodies,
        lintRules,
      );
      expect(configuration.configDirectoryUri).toBe(configUri);
      expect(configuration.rootVolumePath).toBe(rootVolume);
      expect(configuration.bodies).toBe(bodies);
      expect(configuration.lintRules).toBe(lintRules);
    });

    describe('When empty', () => {
      test('It is empty', () => {
        const configuration = new WorkspaceConfiguration(undefined);
        expect(configuration.configDirectoryUri).toBeUndefined();
        expect(configuration.rootVolumePath).toBeUndefined();
        expect(configuration.bodies).toBeUndefined();
        expect(configuration.lintRules).toBeUndefined();
      });
    });
  });

  describe('When merging configuration', () => {
    describe('When merging config uri', () => {
      test('it merges correctly', () => {
        const configUri2 = URI.file('/example');
        const config1 = new WorkspaceConfiguration(configUri);
        const config2 = new WorkspaceConfiguration(configUri2);
        expect(config1.merge(config2).configDirectoryUri).toBe(configUri2);
      });
    });

    describe('When merging root volumes', () => {
      test('it merges correctly', () => {
        const rootVolume1 = 'root';
        const rootVolume2 = 'otherRoot';
        const configEmpty = new WorkspaceConfiguration();
        const config1 = new WorkspaceConfiguration(undefined, rootVolume1);
        const config2 = new WorkspaceConfiguration(undefined, rootVolume2);
        expect(configEmpty.merge(configEmpty).rootVolumePath).toBe(undefined);
        expect(config1.merge(configEmpty).rootVolumePath).toBe(rootVolume1);
        expect(configEmpty.merge(config1).rootVolumePath).toBe(rootVolume1);
        expect(config1.merge(config2).rootVolumePath).toBe(rootVolume2);
      });
    });
    describe('When merging bodies', () => {
      test('it merges correctly', () => {
        const bodies1 = ['Earth', 'Mars'];
        const bodies2 = ['Kerbin', 'Duna'];
        const configEmpty = new WorkspaceConfiguration(configUri);
        const config1 = new WorkspaceConfiguration(
          undefined,
          undefined,
          bodies1,
        );
        const config2 = new WorkspaceConfiguration(
          undefined,
          undefined,
          bodies2,
        );
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
        const configEmpty = new WorkspaceConfiguration(configUri);
        const config1 = new WorkspaceConfiguration(
          undefined,
          undefined,
          undefined,
          lint1,
        );
        const config2 = new WorkspaceConfiguration(
          undefined,
          undefined,
          undefined,
          lint2,
        );
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

  describe('When finding the root volume', () => {
    describe('When the directory exists', () => {
      test('It combines the paths', () => {
        const rootVolume = '../../services';
        const bodies = ['Mun', 'Kerbin'];
        const lintRules = new Map([
          [
            'load-error',
            new LintRule('load-error', 'info', [DIAGNOSTICS.LOAD_ERROR], []),
          ],
        ]);

        const configuration = new WorkspaceConfiguration(
          configUri,
          rootVolume,
          bodies,
          lintRules,
        );

        const expectedUri = URI.file(join(__dirname, rootVolume));
        expect(configuration.rootVolumeUri()).toBeDefined();
        expect(configuration.rootVolumeUri()?.toString()).toBe(
          expectedUri.toString(),
        );
      });
    });

    describe('When the directory does not exit', () => {
      test('It uses the config uri', () => {
        const rootVolume = 'fake';
        const bodies = ['Mun', 'Kerbin'];
        const lintRules = new Map([
          [
            'load-error',
            new LintRule('load-error', 'info', [DIAGNOSTICS.LOAD_ERROR], []),
          ],
        ]);

        const configuration = new WorkspaceConfiguration(
          configUri,
          rootVolume,
          bodies,
          lintRules,
        );

        const expectedUri = URI.file(join(__dirname));
        expect(configuration.rootVolumeUri()).toBeDefined();
        expect(configuration.rootVolumeUri()?.toString()).toBe(
          expectedUri.toString(),
        );
      });
    });

    describe('When the config does not have a uri', () => {
      test('It returns undefined', () => {
        const rootVolume = 'fake';
        const bodies = ['Mun', 'Kerbin'];
        const lintRules = new Map([
          [
            'load-error',
            new LintRule('load-error', 'info', [DIAGNOSTICS.LOAD_ERROR], []),
          ],
        ]);

        const configuration = new WorkspaceConfiguration(
          undefined,
          rootVolume,
          bodies,
          lintRules,
        );

        expect(configuration.rootVolumeUri()).toBeUndefined();
      });
    });
  });
});
