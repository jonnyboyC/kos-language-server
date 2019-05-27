import { ArgumentType } from './types';
import { createStructureType } from "../typeCreators";
import { addPrototype } from '../typeUitlities';
import { aggregateResourceType } from './aggregateResource';

export const activeResourceType: ArgumentType = createStructureType('activeResource');
addPrototype(activeResourceType, aggregateResourceType);
