import { KsSymbolKind } from '../analysis/types';
import { Token } from './token';
import { Range } from 'vscode-languageserver';

/**
 * A class containing the information of a parameter
 */
export class KsParameter {
  /**
   * A kerboscript parameter constructor
   * @param name the name of this parameter
   * @param range the range of this parameter
   */
  constructor(
    public readonly name: Token,
    public readonly range: Range,
  )
  { }

  /**
   * What kind of symbol is represented in this case a parameter
   */
  get tag(): KsSymbolKind.parameter {
    return KsSymbolKind.parameter;
  }
}
