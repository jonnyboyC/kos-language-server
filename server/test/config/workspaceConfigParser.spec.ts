import { parseWorkspaceConfiguration } from '../../src/config/workspaceConfigParser';
import { TextDocument, Range, Position } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { LintRule } from '../../src/config/models/lintRules';
import {
  DIAGNOSTICS,
  CONFIG_DIAGNOSTICS,
} from '../../src/utilities/diagnosticsUtils';

const exampleConfigUri = URI.file('/example/ksconfig.json');

function makeDocument(source: string): TextDocument {
  return TextDocument.create(
    exampleConfigUri.toString(),
    'kos-language-server',
    1,
    source,
  );
}

describe('WorkspaceConfigParser', () => {
  describe('When parsing an empty config', () => {
    describe('When an empty file', () => {
      test('It returns an empty config', () => {
        const empty = makeDocument('');

        const { config, diagnostics } = parseWorkspaceConfiguration(empty);

        expect(diagnostics).toHaveLength(0);
        expect(config.configDirectoryUri);
        expect(config.rootVolumePath).toBe(undefined);
        expect(config.bodies).toBe(undefined);
        expect(config.lintRules).toEqual(new Map());
      });
    });

    describe('When an empty object', () => {
      test('It returns an empty config', () => {
        const empty = makeDocument('{}');

        const { config, diagnostics } = parseWorkspaceConfiguration(empty);

        expect(diagnostics).toHaveLength(0);
        expect(config.rootVolumePath).toBe(undefined);
        expect(config.bodies).toBe(undefined);
        expect(config.lintRules).toEqual(new Map());
      });
    });
  });

  describe('when parsing a non empty config', () => {
    describe('when parsing the root volume', () => {
      describe('When root volume is a string', () => {
        test('It parses', () => {
          const empty = makeDocument('{"archive": "/src" }');

          const { config, diagnostics } = parseWorkspaceConfiguration(empty);

          expect(diagnostics).toHaveLength(0);
          expect(config.rootVolumePath).toBe('/src');
          expect(config.bodies).toBe(undefined);
          expect(config.lintRules).toEqual(new Map());
        });
      });

      describe('When root volume is not a string', () => {
        test('It does nothing', () => {
          const empty = makeDocument('{"archive": 10.3 }');

          const { config, diagnostics } = parseWorkspaceConfiguration(empty);

          expect(diagnostics).toHaveLength(1);
          expect(diagnostics[0].code).toBe(CONFIG_DIAGNOSTICS.INVALID_VALUE);
          expect(diagnostics[0].range).toEqual(
            Range.create(Position.create(0, 12), Position.create(0, 16)),
          );

          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toBe(undefined);
          expect(config.lintRules).toEqual(new Map());
        });
      });
    });

    describe('when parsing the bodies', () => {
      describe('When bodies is a filled array', () => {
        test('It parses', () => {
          const empty = makeDocument('{"bodies": ["Mun", "Kerbin"] }');

          const { config, diagnostics } = parseWorkspaceConfiguration(empty);

          expect(diagnostics).toHaveLength(0);
          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toEqual(['Mun', 'Kerbin']);
          expect(config.lintRules).toEqual(new Map());
        });
      });

      describe('When bodies is a mixed array', () => {
        test('It partially parses', () => {
          const empty = makeDocument('{"bodies": ["Mun", false] }');

          const { config, diagnostics } = parseWorkspaceConfiguration(empty);

          expect(diagnostics).toHaveLength(1);
          expect(diagnostics[0].code).toBe(CONFIG_DIAGNOSTICS.INVALID_VALUE);
          expect(diagnostics[0].range).toEqual(
            Range.create(Position.create(0, 19), Position.create(0, 24)),
          );

          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toEqual(['Mun']);
          expect(config.lintRules).toEqual(new Map());
        });
      });

      describe('When bodies is not a number array', () => {
        test('It returns empty bodies', () => {
          const empty = makeDocument('{"bodies": [10.3] }');

          const { config, diagnostics } = parseWorkspaceConfiguration(empty);

          expect(diagnostics).toHaveLength(1);
          expect(diagnostics[0].code).toBe(CONFIG_DIAGNOSTICS.INVALID_VALUE);
          expect(diagnostics[0].range).toEqual(
            Range.create(Position.create(0, 12), Position.create(0, 16)),
          );

          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toEqual([]);
          expect(config.lintRules).toEqual(new Map());
        });
      });

      describe('When bodies is not an array', () => {
        test('It does nothing', () => {
          const empty = makeDocument('{"bodies": false }');

          const { config, diagnostics } = parseWorkspaceConfiguration(empty);
          expect(diagnostics).toHaveLength(1);
          expect(diagnostics[0].code).toBe(CONFIG_DIAGNOSTICS.INVALID_VALUE);
          expect(diagnostics[0].range).toEqual(
            Range.create(Position.create(0, 11), Position.create(0, 16)),
          );

          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toEqual(undefined);
          expect(config.lintRules).toEqual(new Map());
        });
      });
    });

    describe('when parsing the lint rules', () => {
      describe('When the lint rules are all valid', () => {
        describe('When only a single rule', () => {
          test('It parses', () => {
            const single = makeDocument(
              '{"linting": { "symbol-may-not-exist": "hint" } }',
            );

            const { config, diagnostics } = parseWorkspaceConfiguration(single);

            expect(diagnostics).toHaveLength(0);
            expect(config.rootVolumePath).toBe(undefined);
            expect(config.bodies).toEqual(undefined);
            expect(config.lintRules).toEqual(
              new Map([
                [
                  'symbol-may-not-exist',
                  new LintRule(
                    'symbol-may-not-exist',
                    'hint',
                    [DIAGNOSTICS.SYMBOL_MAY_NOT_EXIST],
                    [],
                  ),
                ],
              ]),
            );
          });
        });
        describe('When multiple rules', () => {
          test('It parses', () => {
            const multiple = makeDocument(
              `{
                "linting": {
                  "symbol-may-not-exist": "off"
                  "symbol-may-not-exist-closure": "error"
                }
              }`,
            );

            const { config, diagnostics } = parseWorkspaceConfiguration(
              multiple,
            );

            expect(diagnostics).toHaveLength(0);
            expect(config.rootVolumePath).toBe(undefined);
            expect(config.bodies).toEqual(undefined);
            expect(config.lintRules).toEqual(
              new Map([
                [
                  'symbol-may-not-exist',
                  new LintRule(
                    'symbol-may-not-exist',
                    'off',
                    [DIAGNOSTICS.SYMBOL_MAY_NOT_EXIST],
                    [],
                  ),
                ],
                [
                  'symbol-may-not-exist-closure',
                  new LintRule(
                    'symbol-may-not-exist-closure',
                    'error',
                    [DIAGNOSTICS.SYMBOL_MAY_NOT_RUNTIME_EXIST],
                    [],
                  ),
                ],
              ]),
            );
          });
        });
      });

      describe('When the lint rules are all invalid', () => {
        describe('When only a single rule', () => {
          describe('when rule does not exist', () => {
            test('It parses empty linting rule', () => {
              const invalid = makeDocument(
                '{"linting": { "invalid-rul": "hint" } }',
              );

              const { config, diagnostics } = parseWorkspaceConfiguration(
                invalid,
              );

              expect(diagnostics).toHaveLength(1);
              expect(diagnostics[0].code).toBe(
                CONFIG_DIAGNOSTICS.INVALID_PROPERTY,
              );
              expect(diagnostics[0].range).toEqual(
                Range.create(Position.create(0, 14), Position.create(0, 27)),
              );

              expect(config.rootVolumePath).toBe(undefined);
              expect(config.bodies).toEqual(undefined);
              expect(config.lintRules).toEqual(new Map());
            });
          });

          describe('when rule does has an invalid level', () => {
            test('It parses', () => {
              const invalid = makeDocument(
                '{"linting": { "symbol-may-not-exist": "fake" } }',
              );

              const { config, diagnostics } = parseWorkspaceConfiguration(
                invalid,
              );

              expect(diagnostics).toHaveLength(1);
              expect(diagnostics[0].code).toBe(
                CONFIG_DIAGNOSTICS.INVALID_VALUE,
              );
              expect(diagnostics[0].range).toEqual(
                Range.create(Position.create(0, 38), Position.create(0, 44)),
              );

              expect(config.rootVolumePath).toBeUndefined();
              expect(config.bodies).toBeUndefined();
              expect(config.lintRules).toEqual(new Map());
            });
          });
        });
      });
    });

    describe('when an invalid property exists', () => {
      test('reports a diagnostics', () => {
        const invalid = makeDocument('{"fake": "fake" }');

        const { config, diagnostics } = parseWorkspaceConfiguration(invalid);

        expect(diagnostics).toHaveLength(1);
        expect(diagnostics[0].code).toBe(CONFIG_DIAGNOSTICS.INVALID_PROPERTY);
        expect(diagnostics[0].range).toEqual(
          Range.create(Position.create(0, 1), Position.create(0, 7)),
        );

        expect(config.rootVolumePath).toBeUndefined();
        expect(config.bodies).toBeUndefined();
        expect(config.lintRules).toEqual(new Map());
      });
    });
  });
});
