import { createStructureType, createSuffixType, noMap } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';

export const addonType = createStructureType('addon');
addonType.addSuper(noMap(structureType));

addonType.addSuffixes(noMap(createSuffixType('available', booleanType)));
