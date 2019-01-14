import { IType } from './types';
import { createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { stringType, scalarType, booleanType } from './primitives';
import { vectorType } from './collections/vector';
import { bodyTargetType } from './orbital/bodyTarget';

export const orbitInfoType: IType = createStructureType('orbitInfo');
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
