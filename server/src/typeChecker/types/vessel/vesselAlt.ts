import { createStructureType, createArgSuffixType } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/scalar';

export const vesselAltType = createStructureType('vesselAlt');
vesselAltType.addSuper(structureType);

vesselAltType.addSuffixes(
  createArgSuffixType('apoapsis', scalarType),
  createArgSuffixType('periapsis', scalarType),
  createArgSuffixType('radar', scalarType),
);
