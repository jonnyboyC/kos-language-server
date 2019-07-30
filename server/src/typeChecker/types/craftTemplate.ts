import { createStructureType, createSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';

export const craftTemplateType = createStructureType('craftTemplate');
craftTemplateType.addSuper(structureType);

craftTemplateType.addSuffixes(
  createSuffixType('name', stringType),
  createSuffixType('description', stringType),
  createSuffixType('editor', stringType),
  createSuffixType('launchSite', stringType),
  createSuffixType('mass', stringType),
  createSuffixType('cost', stringType),
  createSuffixType('partCount', scalarType),
);
