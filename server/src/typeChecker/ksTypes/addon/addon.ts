import { createType, createSuffixType, noMap } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';

export const addonType = createType('addon');
addonType.addSuper(noMap(structureType));

addonType.addSuffixes(noMap(createSuffixType('available', booleanType)));
