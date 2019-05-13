import { KsSymbol, IKsSymbolTracker, IKsSet, IKsDeclared } from './types';
import { structureType } from '../typeChecker/types/primitives/structure';
import { Location } from 'vscode-languageserver';
import { IArgumentType, IFunctionType } from '../typeChecker/types/types';
import { binaryRightKey, locationEqual } from '../utilities/positionUtils';
import { builtIn } from '../utilities/constants';

// class KsTrackerScope {
//   public readonly sets: IKsSet[];
//   public readonly scopePosition: IScopePosition;
//   public readonly children: KsTrackerScope[];

//   constructor(scopePosition: IScopePosition) {
//     this.scopePosition = scopePosition;
//     this.sets = [];
//     this.children = [];
//   }
// }

export class KsSymbolTracker<T extends KsSymbol> implements IKsSymbolTracker {
  public readonly declared: IKsDeclared<T>;
  public readonly sets: IKsSet[];
  public readonly usages: Location[];

  constructor(
    symbol: T,
    public uri: string,
    public type: IArgumentType | IFunctionType = structureType,
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

  public declareType(type: IArgumentType): void {
    this.declared.type = type;
  }

  public getType(loc: Location): Maybe<IArgumentType | IFunctionType> {
    return this.getLocation(loc).type;
  }

  public getLocation(loc: Location): IKsSet | IKsDeclared<T> {
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

  public setType(loc: Location, type: IArgumentType): void {
    const nearestSet = this.getLocation(loc);
    if (locationEqual(nearestSet, loc)) {
      nearestSet.type = type;
    }
  }
}

export const createSymbolSet = (
  loc: Location,
  type: IArgumentType = structureType,
): IKsSet => ({ type, uri: loc.uri, range: loc.range });
