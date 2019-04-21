import { KsSymbol, IKsSymbolTracker, IKsChange, IKsDeclared } from './types';
import { structureType } from '../typeChecker/types/primitives/structure';
import { Location } from 'vscode-languageserver';
import { IExpr, ISuffixTerm } from '../parser/types';
import { IArgumentType, IFunctionType } from '../typeChecker/types/types';
import { empty } from '../utilities/typeGuards';
import { binaryRightKey } from '../utilities/positionUtils';
import { builtIn } from '../utilities/constants';

export class KsSymbolTracker<T extends KsSymbol>
  implements IKsSymbolTracker {
  public readonly declared: IKsDeclared<T>;
  public readonly sets: IKsChange[];
  public readonly usages: IKsChange[];

  constructor(
    public symbol: T,
    public type: IArgumentType | IFunctionType = structureType) {
    this.declared = {
      symbol,
      type,
      uri: symbol.name.uri,
      range: symbol.name.range,
    };
    this.sets = [];
    this.usages = [];
  }

  public getLocation(loc: Location): Maybe<IKsChange | IKsDeclared<T>> {
    // if builtin type can't change so just return declared type
    if (this.declared.uri === builtIn) {
      return this.declared;
    }

    const ranges = this.declared.symbol.name.uri === loc.uri
      ? [this.declared, ...this.sets.filter(set => set.uri === loc.uri)]
      : this.sets.filter(set => set.uri === loc.uri);

    return binaryRightKey(ranges, loc.range.start, x => x.range);
  }

  public declareType(type: IArgumentType): void {
    this.declared.type = type;
  }

  public getType(loc: Location): Maybe<IArgumentType | IFunctionType> {
    const locationEntity = this.getLocation(loc);
    return empty(locationEntity) ? undefined : locationEntity.type;
  }

  public setType(loc: Location, type: IArgumentType): void {
    this.sets.push(createEnitityChange(loc, undefined, type));
  }
}

export const createEnitityChange = (
  loc: Location,
  expr?: IExpr | ISuffixTerm,
  type: IArgumentType = structureType):
  IKsChange => ({ type, expr, uri: loc.uri, range: loc.range });
