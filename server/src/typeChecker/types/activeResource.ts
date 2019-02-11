import { IArgumentType } from './types';
import { createStructureType } from './ksType';
import { addPrototype } from './typeUitlities';
import { aggregateResourceType } from './aggregateResource';

export const activeResourceType: IArgumentType = createStructureType('activeResource');
addPrototype(activeResourceType, aggregateResourceType);
