import { createStructureType, createSuffixType, noMap } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { listType } from '../collections/list';
import { stringType } from '../primitives/string';
import { vesselTargetType } from '../orbital/vesselTarget';
import { partType } from './part';
import { dockingPortType } from './dockingPort';
import { aggregateResourceType } from './aggregateResource';

export const elementType = createStructureType('element');
elementType.addSuper(noMap(structureType));

elementType.addSuffixes(
  noMap(createSuffixType('name', stringType)),
  noMap(createSuffixType('uid', stringType)),
  noMap(createSuffixType('vessel', vesselTargetType)),
  noMap(createSuffixType('parts', listType.toConcrete(partType))),
  noMap(createSuffixType('dockingPorts', listType.toConcrete(dockingPortType))),
  noMap(createSuffixType('resources', listType.toConcrete(aggregateResourceType))),
);
