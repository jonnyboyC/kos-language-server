import { ArgumentType } from './types';
import { createStructureType, createSuffixType } from "../typeCreators";
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';
import { bodyTargetType } from './orbital/bodyTarget';

export const orbitInfoType: ArgumentType = createStructureType('orbitInfo');
addPrototype(orbitInfoType, structureType);

addSuffixes(
  orbitInfoType,
  createSuffixType('name', stringType),
  createSuffixType('apoapsis', scalarType),
  createSuffixType('periapsis', scalarType),
  createSuffixType('body', bodyTargetType),
  createSuffixType('period', scalarType),
  createSuffixType('inclination', scalarType),
  createSuffixType('eccentricity', scalarType),
  createSuffixType('semiMajorAxis', scalarType),
  createSuffixType('semiMinorAxis', scalarType),
  createSuffixType('lan', scalarType),
  createSuffixType('longitudeOfAscendingNode', scalarType),
  createSuffixType('argumentOfPeriapsis', scalarType),
  createSuffixType('trueAnomaly', scalarType),
  createSuffixType('meanAnomalyAtEpoch', scalarType),
  createSuffixType('epoch', scalarType),
  createSuffixType('transition', stringType),
  createSuffixType('position', vectorType),
  createSuffixType('nextPatch', orbitInfoType),
  createSuffixType('hasNextPatch', booleanType),
  createSuffixType('nextPatchEta', scalarType),
  createSuffixType('vStateVector', vectorType),
  createSuffixType('rStateVector', vectorType),
);
