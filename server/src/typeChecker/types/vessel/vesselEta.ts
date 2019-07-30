import { createStructureType, createArgSuffixType } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/scalar';

export const vesselEtaType = createStructureType('vesselEta');
vesselEtaType.addSuper(structureType);

vesselEtaType.addSuffixes(
  createArgSuffixType('apoapsis', scalarType),
  createArgSuffixType('periapsis', scalarType),
  createArgSuffixType('transition', scalarType),
);
