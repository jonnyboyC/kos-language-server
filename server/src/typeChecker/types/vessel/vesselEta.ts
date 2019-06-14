import { ArgumentType } from '../types';
import { createStructureType, createArgSuffixType } from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/scalar';

export const vesselEtaType: ArgumentType = createStructureType('vesselEta');
addPrototype(vesselEtaType, structureType);

addSuffixes(
  vesselEtaType,
  createArgSuffixType('apoapsis', scalarType),
  createArgSuffixType('periapsis', scalarType),
  createArgSuffixType('transition', scalarType),
);
