import { createStructureType, createSuffixType } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { listType } from '../collections/list';
import { lexiconType } from '../collections/lexicon';
import { activeResourceType } from '../parts/activeResource';
import { scalarType } from '../primitives/scalar';

export const stageType = createStructureType('stage');
stageType.addSuper(structureType);

stageType.addSuffixes(
  createSuffixType('number', scalarType),
  createSuffixType('ready', scalarType),
  createSuffixType('resources', listType.toConcreteType(activeResourceType)),
  createSuffixType('resourcesLex', lexiconType),
  createSuffixType('nextDecoupler', structureType),
  createSuffixType('nextSeparator', structureType),
);
