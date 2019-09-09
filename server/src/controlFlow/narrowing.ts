import { KsSymbol } from '../analysis/types';
import { IType } from '../typeChecker/types';

/**
 * A class representing a type narrowing. Typically this would be accomplished with
 * something of this form `a:istype("string")`
 */
export class Narrowing {
  /**
   * The symbol to be narrowed
   */
  public readonly symbols: KsSymbol;

  /**
   * The types that were "included" in this narrowing
   */
  public readonly includes: IType[];

  /**
   * The types that were "excluded" in this narrowing
   */
  public readonly excludes: IType[];

  public constructor(symbols: KsSymbol, includes: IType[], excludes: IType[]) {
    this.symbols = symbols;
    this.includes = includes;
    this.excludes = excludes;
  }
}
