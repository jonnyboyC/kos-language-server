import { KsEntity, IKsEntityTracker, IKsChange, IKsDeclared } from './types';
import { structureType } from '../typeChecker/types/primitives/structure';
import { Location } from 'vscode-languageserver';
import { IExpr, ISuffixTerm } from '../parser/types';
import { IArgumentType, IFunctionType } from '../typeChecker/types/types';
import { empty } from '../utilities/typeGuards';
import { binaryRightKeyIndex } from '../utilities/positionHelpers';
import { builtIn } from '../utilities/constants';

export class KsEntityTracker<T extends KsEntity>
  implements IKsEntityTracker {
  public readonly declared: IKsDeclared<T>;
  public readonly sets: IKsChange[];
  public readonly usages: IKsChange[];

  constructor(
    public entity: T,
    public type: IArgumentType | IFunctionType = structureType) {
    this.declared = {
      entity,
      type,
      uri: entity.name.uri,
      range: entity.name.range,
    };
    this.sets = [];
    this.usages = [];
  }

  public getLocation(loc: Location): Maybe<IKsChange | IKsDeclared<T>> {
    // if builtin type can't change so just return declared type
    if (this.declared.uri === builtIn) {
      return this.declared;
    }

    const ranges = this.declared.entity.name.uri === loc.uri
      ? [this.declared, ...this.sets.filter(set => set.uri === loc.uri)]
      : this.sets.filter(set => set.uri === loc.uri);

    return binaryRightKeyIndex(ranges, loc.range.start, x => x.range);
  }

  public getType(loc: Location): Maybe<IArgumentType | IFunctionType> {
    const locationEntity = this.getLocation(loc);
    return empty(locationEntity) ? undefined : locationEntity.type;
  }

  public setType(loc: Location, type: IArgumentType | IFunctionType): void {
    const locationEntity = this.getLocation(loc);
    if (!empty(locationEntity)) {
      locationEntity.type = type;
    }
  }
}

export const createEnitityChange = (
  loc: Location,
  expr?: IExpr | ISuffixTerm, type = structureType):
  IKsChange => ({ type, expr, uri: loc.uri, range: loc.range });
