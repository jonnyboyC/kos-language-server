import { SymbolTrackerBase, KsSet, IKsDeclared, TrackerKind, KsBaseSymbol } from './types';
import { structureType } from '../typeChecker/types/primitives/structure';
import { Location } from 'vscode-languageserver';
import { ArgumentType, IFunctionType } from '../typeChecker/types/types';
import { binaryRightKey, locationEqual } from '../utilities/positionUtils';
import { builtIn } from '../utilities/constants';
import { FunctionType } from '../typeChecker/ksType';

export class BasicTracker<T extends KsBaseSymbol = KsBaseSymbol> implements SymbolTrackerBase {
  public readonly declared: IKsDeclared<T, ArgumentType | IFunctionType>;

  /**
   * Infromation about locations where the this symbol was set
   */
  public readonly sets: KsSet[];

  /**
   * Locations where this symbol was used
   */
  public readonly usages: Location[];

  constructor(
    symbol: T,
    public uri: string,
    public type: ArgumentType | IFunctionType = structureType,
  ) {
    this.declared = {
      symbol,
      type,
      uri: symbol.name.uri,
      range: symbol.name.range,
    };
    this.sets = [];
    this.usages = [];
  }

  /**
   * What kind of tracker is this type
   */
  public get kind(): TrackerKind.basic {
    return TrackerKind.basic;
  }

  /**
   * Set the declared type of this symbol
   * @param type type to declare this symbol
   */
  public declareType(type: ArgumentType | FunctionType): void {
    this.declared.type = type;
  }

  /**
   * Get the type at a provided location
   * @param loc location to check
   */
  private getLocation(loc: Location): KsSet | IKsDeclared<T, ArgumentType | IFunctionType> {
    // if builtin type can't change so just return declared type
    if (this.declared.uri === builtIn) {
      return this.declared;
    }

    // Will need ot do better this sort of handles the case of
    // local x is 0. set x to x + 1.
    const ranges = this.sets.filter(
      set => set.uri === loc.uri && set.type !== structureType,
    );
    const found = binaryRightKey(ranges, loc.range.start, x => x.range);

    return found || this.declared;
  }

  /**
   * Get the type at a location
   * @param loc query location
   */
  public getType(loc: Location): Maybe<ArgumentType | IFunctionType> {
    return this.getLocation(loc).type;
  }

  /**
   * Set the type at a location
   * @param loc location to set
   * @param type type to set
   */
  public setType(loc: Location, type: ArgumentType | FunctionType): void {
    const nearestSet = this.getLocation(loc);
    if (locationEqual(nearestSet, loc)) {
      nearestSet.type = type;
    }
  }
}

/**
 * Create a set symbol
 * @param loc location to create the set
 * @param type type of this set
 */
export const createSymbolSet = (
  loc: Location,
  type: ArgumentType = structureType,
): KsSet => ({ type, uri: loc.uri, range: loc.range });
