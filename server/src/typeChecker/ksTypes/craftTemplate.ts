import { createType, createSuffixType, noMap } from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';

export const craftTemplateType = createType('craftTemplate');
craftTemplateType.addSuper(noMap(structureType));

craftTemplateType.addSuffixes(
  noMap(createSuffixType('name', stringType)),
  noMap(createSuffixType('description', stringType)),
  noMap(createSuffixType('editor', stringType)),
  noMap(createSuffixType('launchSite', stringType)),
  noMap(createSuffixType('mass', stringType)),
  noMap(createSuffixType('cost', stringType)),
  noMap(createSuffixType('partCount', scalarType)),
);
