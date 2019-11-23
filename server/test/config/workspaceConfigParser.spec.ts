import { parseWorkspaceConfiguration } from '../../src/config/workspaceConfigParser';
import { TextDocument } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { LintRule } from '../../src/config/models/lintRules';
import { DIAGNOSTICS } from '../../src/utilities/diagnosticsUtils';

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

        const config = parseWorkspaceConfiguration(empty);
        expect(config.configDirectoryUri);
        expect(config.rootVolumePath).toBe(undefined);
        expect(config.bodies).toBe(undefined);
        expect(config.lintRules).toEqual(new Map());
      });
    });

    describe('When an empty object', () => {
      test('It retursn an empty config', () => {
        const empty = makeDocument('{}');

        const config = parseWorkspaceConfiguration(empty);
        expect(config.rootVolumePath).toBe(undefined);
        expect(config.bodies).toBe(undefined);
        expect(config.lintRules).toEqual(new Map());
      });
    });
  });

  describe('When parsing a non empty config', () => {
    describe('When parsing the root volume', () => {
      describe('When root volume is a string', () => {
        test('It parses', () => {
          const empty = makeDocument('{"archiveDirectory": "/src" }');

          const config = parseWorkspaceConfiguration(empty);
          expect(config.rootVolumePath).toBe('/src');
          expect(config.bodies).toBe(undefined);
          expect(config.lintRules).toEqual(new Map());
        });
      });

      describe('When root volume is not a string', () => {
        test('It does nothing', () => {
          const empty = makeDocument('{"archiveDirectory": 10.3 }');

          const config = parseWorkspaceConfiguration(empty);
          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toBe(undefined);
          expect(config.lintRules).toEqual(new Map());
        });
      });
    });

    describe('When parsing the bodies', () => {
      describe('When bodies is a filled array', () => {
        test('It parses', () => {
          const empty = makeDocument('{"bodies": ["Mun", "Kerbin"] }');

          const config = parseWorkspaceConfiguration(empty);
          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toEqual(['Mun', 'Kerbin']);
          expect(config.lintRules).toEqual(new Map());
        });
      });

      describe('When bodies is a mixed array', () => {
        test('It partially parses', () => {
          const empty = makeDocument('{"bodies": ["Mun", false] }');

          const config = parseWorkspaceConfiguration(empty);
          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toEqual(['Mun']);
          expect(config.lintRules).toEqual(new Map());
        });
      });

      describe('When bodies is not a number array', () => {
        test('It returns empty bodies', () => {
          const empty = makeDocument('{"bodies": [10.3] }');

          const config = parseWorkspaceConfiguration(empty);
          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toEqual([]);
          expect(config.lintRules).toEqual(new Map());
        });
      });

      describe('When bodies is not an array', () => {
        test('It does nothing', () => {
          const empty = makeDocument('{"bodies": false }');

          const config = parseWorkspaceConfiguration(empty);
          expect(config.rootVolumePath).toBe(undefined);
          expect(config.bodies).toEqual(undefined);
          expect(config.lintRules).toEqual(new Map());
        });
      });
    });

    describe('When parsing the lint rules', () => {
      describe('When the lint rules are all valid', () => {
        describe('When only a single rule', () => {
          test('It parses', () => {
            const single = makeDocument(
              '{"linting": { "symbol-may-not-exist": "hint" } }',
            );

            const config = parseWorkspaceConfiguration(single);
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

            const config = parseWorkspaceConfiguration(multiple);
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
          describe('when rule does not exixt', () => {
            test('It parses', () => {
              const invalid = makeDocument(
                '{"linting": { "invalid-rul": "hint" } }',
              );

              const config = parseWorkspaceConfiguration(invalid);
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

              const config = parseWorkspaceConfiguration(invalid);
              expect(config.rootVolumePath).toBe(undefined);
              expect(config.bodies).toEqual(undefined);
              expect(config.lintRules).toEqual(new Map());
            });
          });
        });
      });
    });
  });
});
