import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/primitives';

export const vesselAltType: IArgumentType = createStructureType('vesselAlt');
addPrototype(vesselAltType, structureType);

addSuffixes(
  vesselAltType,
  createArgSuffixType('apoapsis', scalarType),
  createArgSuffixType('periapsis', scalarType),
  createArgSuffixType('radar', scalarType),
);
