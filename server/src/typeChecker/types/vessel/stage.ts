import { ArgumentType } from '../types';
import { createStructureType, createSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { listType } from '../collections/list';
import { lexiconType } from '../collections/lexicon';
import { activeResourceType } from '../activeResource';
import { scalarType } from '../primitives/scalar';

export const stageType: ArgumentType = createStructureType('stage');
addPrototype(stageType, structureType);

addSuffixes(
  stageType,
  createSuffixType('number', scalarType),
  createSuffixType('ready', scalarType),
  createSuffixType('resources', listType.toConcreteType(activeResourceType)),
  createSuffixType('resourcesLex', lexiconType),
  createSuffixType('nextDecoupler', structureType),
  createSuffixType('nextSeparator', structureType),
);
