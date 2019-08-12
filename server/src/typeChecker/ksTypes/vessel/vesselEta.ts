import { createStructureType, createArgSuffixType, noMap } from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/scalar';

export const vesselEtaType = createStructureType('vesselEta');
vesselEtaType.addSuper(noMap(structureType));

vesselEtaType.addSuffixes(
  noMap(createArgSuffixType('apoapsis', scalarType)),
  noMap(createArgSuffixType('periapsis', scalarType)),
  noMap(createArgSuffixType('transition', scalarType)),
);
