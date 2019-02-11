import { IArgumentType } from '../types';
import { createStructureType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../structure';
import { scalarType } from '../primitives';
import { listType } from '../collections/list';
import { lexiconType } from '../collections/lexicon';
import { activeResourceType } from '../activeResource';

export const stageType: IArgumentType = createStructureType('stage');
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
