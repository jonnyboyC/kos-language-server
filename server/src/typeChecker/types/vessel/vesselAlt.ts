import { ArgumentType } from '../types';
import { createStructureType, createArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/scalar';

export const vesselAltType: ArgumentType = createStructureType('vesselAlt');
addPrototype(vesselAltType, structureType);

addSuffixes(
  vesselAltType,
  createArgSuffixType('apoapsis', scalarType),
  createArgSuffixType('periapsis', scalarType),
  createArgSuffixType('radar', scalarType),
);
