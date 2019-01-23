import { KsEntity, IKsEntityTracker, IKsChange } from './types';
import { structureType } from '../typeChecker/types/structure';
import { Location } from 'vscode-languageserver';
import { IExpr } from '../parser/types';

export const createTracker = (entity: KsEntity, type = structureType):
  IKsEntityTracker => {
  return {
    declared: {
      entity,
      type,
    },
    sets: [],
    usages: [],
  };
};

export const createUsage = (loc: Location, expr?: IExpr, type = structureType): IKsChange => {
  return {
    type,
    expr,
    loc,
  };
};
