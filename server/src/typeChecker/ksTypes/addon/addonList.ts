import { createType, createArgSuffixType, noMap } from '../../utilities/typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';

export const addonListType = createType('addonList');
addonListType.addSuper(noMap(structureType));

addonListType.addSuffixes(
  /* TODO this type can have runtime addons with string -> addon maps */
  noMap(createArgSuffixType('available', booleanType, stringType)),
  noMap(createArgSuffixType('hasAddon', booleanType, stringType)),
);
