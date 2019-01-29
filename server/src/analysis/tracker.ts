import { KsEntity, IKsEntityTracker, IKsChange, IKsDeclared } from './types';
import { structureType } from '../typeChecker/types/structure';
import { Location } from 'vscode-languageserver';
import { IExpr } from '../parser/types';
import { IType } from '../typeChecker/types/types';
import { locationEqual } from '../utilities/positionHelpers';
import { empty } from '../utilities/typeGuards';

export class KsEntityTracker<T extends KsEntity> implements IKsEntityTracker {
  public readonly declared: IKsDeclared<T>;
  public readonly sets: IKsChange[];
  public readonly usages: IKsChange[];

  constructor(
    public entity: T,
    public type = structureType) {
    this.declared = {
      entity,
      type,
    };
    this.sets = [];
    this.usages = [];
  }

  public getLocation(loc: Location): Maybe<IKsChange | IKsDeclared<T>> {
    const { name } = this.declared.entity;
    if (locationEqual(name.location(), loc)) {
      return this.declared;
    }

    for (const set of this.sets) {
      if (locationEqual(set.loc, loc)) {
        return set;
      }
    }

    for (const usage of this.usages) {
      if (locationEqual(usage.loc, loc)) {
        return usage;
      }
    }

    return undefined;
    // throw new Error(`location ${loc.uri} ${rangeToString(loc.range)}`
    // + ` is not a usage or declaration of ${this.declared.entity.name.lexeme}`);
  }

  public getType(loc: Location): Maybe<IType> {
    const locationEntity = this.getLocation(loc);
    return empty(locationEntity) ? undefined : locationEntity.type;
  }
  public setType(loc: Location, type: IType): void {
    const locationEntity = this.getLocation(loc);
    if (!empty(locationEntity)) {
      locationEntity.type = type;
    }
  }
}

export const createEnitityChange = (loc: Location, expr?: IExpr, type = structureType):
  IKsChange => ({ loc, type, expr });
