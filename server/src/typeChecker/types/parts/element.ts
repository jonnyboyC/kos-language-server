import { createStructureType, createSuffixType } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { listType } from '../collections/list';
import { stringType } from '../primitives/string';
import { vesselTargetType } from '../orbital/vesselTarget';
import { partType } from './part';
import { dockingPortType } from './dockingPort';
import { aggregateResourceType } from './aggregateResource';

export const elementType = createStructureType('element');
elementType.addSuper(structureType);

elementType.addSuffixes(
  createSuffixType('name', stringType),
  createSuffixType('uid', stringType),
  createSuffixType('vessel', vesselTargetType),
  createSuffixType('parts', listType.toConcreteType(partType)),
  createSuffixType('dockingPorts', listType.toConcreteType(dockingPortType)),
  createSuffixType('resources', listType.toConcreteType(aggregateResourceType)),
);
