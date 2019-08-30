import { createType, createSuffixType, noMap } from '../../utilities/typeCreators';
import { structureType } from '../primitives/structure';
import { listType } from '../collections/list';
import { stringType } from '../primitives/string';
import { vesselTargetType } from '../orbital/vesselTarget';
import { partType } from './part';
import { dockingPortType } from './dockingPort';
import { aggregateResourceType } from './aggregateResource';
import { decouplerType } from './decoupler';

export const elementType = createType('element');
elementType.addSuper(noMap(structureType));

elementType.addSuffixes(
  noMap(createSuffixType('name', stringType)),
  noMap(createSuffixType('uid', stringType)),
  noMap(createSuffixType('vessel', vesselTargetType)),
  noMap(createSuffixType('parts', listType.apply(partType))),
  noMap(createSuffixType('dockingPorts', listType.apply(dockingPortType))),
  noMap(createSuffixType('decouplers', listType.apply(decouplerType))),
  noMap(createSuffixType('separators', listType.apply(decouplerType))),
  noMap(createSuffixType('resources', listType.apply(aggregateResourceType))),
);
