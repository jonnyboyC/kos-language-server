import { createStructureType, createSuffixType } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';

export const addonType = createStructureType('addon');
addonType.addSuper(structureType);

addonType.addSuffixes(createSuffixType('available', booleanType));
