import { DirectiveTokens } from './types';
import { DirectiveContainer } from './directiveContainer';
import { TokenType } from '../models/tokentypes';
import { DiagnosticUri } from '../types';
import { Include } from './include';
import { isInclude, isRegion, isEndRegion } from './utils';
import { BasicDirective } from './basicDirectives';

export interface DirectiveResult {
  directives: DirectiveContainer;
  diagnostics: DiagnosticUri[];
}

export const directiveParser = (
  directives: DirectiveTokens[],
): DirectiveResult => {
  const diagnostics: DiagnosticUri[] = [];
  const builder: DirectiveContainer = {
    include: [],
    region: [],
    endRegion: [],
  };

  for (const directive of directives) {
    switch (directive.directive.type) {
      case TokenType.include:
        if (isInclude(directive)) {
          const result = Include.parse(directive);
          if (result instanceof Include) {
            builder.include.push(result);
          } else {
            diagnostics.push(result);
          }
        }

        break;
      case TokenType.region:
        if (isRegion(directive)) {
          const result = BasicDirective.parse(directive);
          builder.region.push(result);
        }

        break;
      case TokenType.endRegion:
        if (isEndRegion(directive)) {
          const result = BasicDirective.parse(directive);
          builder.endRegion.push(result);
        }

        break;
    }
  }

  return {
    directives: builder,
    diagnostics,
  };
};
