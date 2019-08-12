import { createStructureType, createSuffixType, noMap } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { listType } from '../collections/list';
import { lexiconType } from '../collections/lexicon';
import { activeResourceType } from '../parts/activeResource';
import { scalarType } from '../primitives/scalar';

export const stageType = createStructureType('stage');
stageType.addSuper(noMap(structureType));

stageType.addSuffixes(
  noMap(createSuffixType('number', scalarType)),
  noMap(createSuffixType('ready', scalarType)),
  noMap(createSuffixType('resources', listType.toConcrete(activeResourceType))),
  noMap(createSuffixType('resourcesLex', lexiconType)),
  noMap(createSuffixType('nextDecoupler', structureType)),
  noMap(createSuffixType('nextSeparator', structureType)),
);
