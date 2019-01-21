import { KsEntity, IKsEntityTracker, IKsUsage } from './types';
import { structureType } from '../typeChecker/types/structure';
import { Location } from 'vscode-languageserver';

export const createTracker = (entity: KsEntity, type = structureType): IKsEntityTracker => {
  return {
    declared: {
      entity,
      type,
    },
    usages: [],
  };
};

export const createUsage = (loc: Location, type = structureType): IKsUsage => {
  return {
    type,
    loc,
  };
};
