import { createStructureType, noMap } from '../../typeCreators';
import { aggregateResourceType } from './aggregateResource';

export const activeResourceType = createStructureType('activeResource');
activeResourceType.addSuper(noMap(aggregateResourceType));
