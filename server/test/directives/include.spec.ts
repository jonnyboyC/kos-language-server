import { DirectiveTokens } from '../../src/directives/types';
import { createToken } from '../utilities/factories';
import { TokenType } from '../../src/models/tokentypes';
import { Include } from '../../src/directives/include';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { DIAGNOSTICS } from '../../src/utilities/diagnosticsUtils';
import { scanSource } from '../utilities/setup';

const createDirective = (
  source: string,
): DirectiveTokens<TokenType.include> => {
  const result = scanSource(source);

  expect(result.tokens).toHaveLength(0);
  expect(result.diagnostics).toHaveLength(0);
  expect(result.directiveTokens).toHaveLength(1);
  expect(result.directiveTokens[0].directive.type).toBe(TokenType.include);

  return result.directiveTokens[0] as any;
};

describe('Include', () => {
  describe('when parsing', () => {
    describe('when valid', () => {
      it('parse into an Include', () => {
        const directive = createDirective(
          '// #include "0://somePath.ks" some comment',
        );

        const result = Include.parse(directive);
        expect(result).toBeInstanceOf(Include);

        if (result instanceof Include) {
          expect(result.directive).toBe(directive.directive);
          expect(result.path).toBe(directive.tokens[0]);
          expect(result.includePath()).toBe('0://somePath.ks');
        }
      });
    });

    describe('when invalid', () => {
      describe('when there is no path', () => {
        it('parser returns a diagnostics', () => {
          const directive = createDirective('// #include');

          const result = Include.parse(directive);
          expect(result).not.toBeInstanceOf(Include);

          if (!(result instanceof Include)) {
            expect(result.message).toBe(
              'Must include string or bare path in #include directive',
            );
            expect(result.severity).toBe(DiagnosticSeverity.Information);
            expect(result.code).toBe(DIAGNOSTICS.DIRECTIVE_INVALID_INCLUDE);
          }
        });
      });

      describe('when path is wrong type', () => {
        it('parser returns a diagnostics', () => {
          const directive = createDirective('// #include 123');

          const result = Include.parse(directive);
          expect(result).not.toBeInstanceOf(Include);

          if (!(result instanceof Include)) {
            expect(result.message).toBe(
              'Must include string or bare path in #include directive',
            );
            expect(result.severity).toBe(DiagnosticSeverity.Information);
            expect(result.code).toBe(DIAGNOSTICS.DIRECTIVE_INVALID_INCLUDE);
          }
        });
      });
    });
  });

  describe('include path', () => {
    describe('when path is a string', () => {
      it('returns the string literal', () => {
        const include = new Include(
          createToken(TokenType.include, '// #include') as any,
          createToken(
            TokenType.string,
            '"0://somePath.ks"',
            '0://somePath.ks',
          ) as any,
        );

        expect(include.includePath()).toBe('0://somePath.ks');
      });
    });

    describe('when path is a file identifier', () => {
      it('returns the string literal', () => {
        const include = new Include(
          createToken(TokenType.include, '// #include') as any,
          createToken(TokenType.fileIdentifier, 'file.ks') as any,
        );

        expect(include.includePath()).toBe('file.ks');
      });
    });
  });
});
