import { createType, noMap } from '../../utilities/typeCreators';
import { aggregateResourceType } from './aggregateResource';

export const activeResourceType = createType('activeResource');
activeResourceType.addSuper(noMap(aggregateResourceType));
