import { createStructureType, createArgSuffixType, noMap } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/scalar';

export const vesselAltType = createStructureType('vesselAlt');
vesselAltType.addSuper(noMap(structureType));

vesselAltType.addSuffixes(
  noMap(createArgSuffixType('apoapsis', scalarType)),
  noMap(createArgSuffixType('periapsis', scalarType)),
  noMap(createArgSuffixType('radar', scalarType)),
);
