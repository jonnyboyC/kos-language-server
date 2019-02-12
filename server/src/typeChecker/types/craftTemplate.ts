import { IArgumentType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { stringType, scalarType } from './primitives/primitives';

export const craftTemplateType: IArgumentType = createStructureType('craftTemplate');
addPrototype(craftTemplateType, structureType);

addSuffixes(
  craftTemplateType,
  createSuffixType('name', stringType),
  createSuffixType('description', stringType),
  createSuffixType('editor', stringType),
  createSuffixType('launchSite', stringType),
  createSuffixType('mass', stringType),
  createSuffixType('cost', stringType),
  createSuffixType('partCount', scalarType),
);
