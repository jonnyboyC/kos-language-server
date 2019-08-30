import { createType, createSuffixType, noMap } from '../../utilities/typeCreators';
import { structureType } from '../primitives/structure';
import { listType } from '../collections/list';
import { lexiconType } from '../collections/lexicon';
import { activeResourceType } from '../parts/activeResource';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';

export const stageType = createType('stage');
stageType.addSuper(noMap(structureType));

stageType.addSuffixes(
  noMap(createSuffixType('number', scalarType)),
  noMap(createSuffixType('ready', booleanType)),
  noMap(createSuffixType('resources', listType.apply(activeResourceType))),
  noMap(createSuffixType('resourcesLex', lexiconType)),
  noMap(createSuffixType('nextDecoupler', structureType)),
  noMap(createSuffixType('nextSeparator', structureType)),
);
