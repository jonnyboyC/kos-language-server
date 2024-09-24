import {
  createArgSuffixType,
  createType,
  noMap,
} from '../utilities/typeCreators';
import { scalarType } from './primitives/scalar';
import { structureType } from './primitives/structure';

export const orbitEtaType = createType('orbitEta');
orbitEtaType.addSuper(noMap(structureType));

orbitEtaType.addSuffixes(
  noMap(createArgSuffixType('apoapsis', scalarType)),
  noMap(createArgSuffixType('periapsis', scalarType)),
  noMap(createArgSuffixType('transition', scalarType)),
);
