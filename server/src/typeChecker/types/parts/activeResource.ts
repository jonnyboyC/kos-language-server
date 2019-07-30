import { createStructureType } from '../../typeCreators';
import { aggregateResourceType } from './aggregateResource';

export const activeResourceType = createStructureType('activeResource');
activeResourceType.addSuper(aggregateResourceType);
