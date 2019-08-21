import { createType, createSuffixType, noMap } from '../typeCreators';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';
import { bodyTargetType } from './orbital/bodyTarget';

export const orbitInfoType = createType('orbitInfo');
orbitInfoType.addSuper(noMap(structureType));

orbitInfoType.addSuffixes(
  noMap(createSuffixType('name', stringType)),
  noMap(createSuffixType('apoapsis', scalarType)),
  noMap(createSuffixType('periapsis', scalarType)),
  noMap(createSuffixType('body', bodyTargetType)),
  noMap(createSuffixType('period', scalarType)),
  noMap(createSuffixType('inclination', scalarType)),
  noMap(createSuffixType('eccentricity', scalarType)),
  noMap(createSuffixType('semiMajorAxis', scalarType)),
  noMap(createSuffixType('semiMinorAxis', scalarType)),
  noMap(createSuffixType('lan', scalarType)),
  noMap(createSuffixType('longitudeOfAscendingNode', scalarType)),
  noMap(createSuffixType('argumentOfPeriapsis', scalarType)),
  noMap(createSuffixType('trueAnomaly', scalarType)),
  noMap(createSuffixType('meanAnomalyAtEpoch', scalarType)),
  noMap(createSuffixType('epoch', scalarType)),
  noMap(createSuffixType('transition', stringType)),
  noMap(createSuffixType('position', vectorType)),
  noMap(createSuffixType('nextPatch', orbitInfoType)),
  noMap(createSuffixType('hasNextPatch', booleanType)),
  noMap(createSuffixType('nextPatchEta', scalarType)),
  noMap(createSuffixType('vStateVector', vectorType)),
  noMap(createSuffixType('rStateVector', vectorType)),
);
