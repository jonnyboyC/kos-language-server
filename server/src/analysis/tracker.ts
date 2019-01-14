import { KsEntity, IKsEntityTracker, IKsUsage } from './types';
import { structureType } from '../typeChecker/types/structure';
import { Range } from 'vscode-languageserver';

export const createTracker = (entity: KsEntity, type = structureType): IKsEntityTracker => {
  return {
    declared: {
      entity,
      type,
    },
    usages: [],
  };
};

export const createUsage = (range: Range, type = structureType): IKsUsage => {
  return {
    type,
    range: {
      start: range.start,
      end: range.end,
    },
  };
};
