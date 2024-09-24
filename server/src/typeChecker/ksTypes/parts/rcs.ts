import { createArgSuffixType, createSetSuffixType, createSuffixType, createType, noMap } from '../../utilities/typeCreators';
import { lexiconType } from '../collections/lexicon';
import { listType } from '../collections/list';
import { vectorType } from '../collections/vector';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { partType } from './part';

export const rcsType = createType('rcs');
rcsType.addSuper(noMap(partType));

rcsType.addSuffixes(
  noMap(createSetSuffixType('enabled', booleanType)),
  noMap(createSetSuffixType('yawEnabled', booleanType)),
  noMap(createSetSuffixType('pitchEnabled', booleanType)),
  noMap(createSetSuffixType('rollEnabled', booleanType)),
  noMap(createSetSuffixType('starboardEnabled', booleanType)),
  noMap(createSetSuffixType('topEnabled', booleanType)),
  noMap(createSetSuffixType('foreEnabled', booleanType)),
  noMap(createSetSuffixType('foreByThrottle', booleanType)),
  noMap(createSetSuffixType('fullThrust', booleanType)),
  noMap(createSetSuffixType('thrustLimit', scalarType)),
  noMap(createSuffixType('availableThrust', scalarType)),
  noMap(createArgSuffixType('availableThrustAt', scalarType, scalarType)),
  noMap(createSuffixType('maxThrust', scalarType)),
  noMap(createSuffixType('maxFuelFlow', scalarType)),
  noMap(createSuffixType('isp', scalarType)),
  noMap(createSuffixType('visp', scalarType)),
  noMap(createSuffixType('vacuumIsp', scalarType)),
  noMap(createSuffixType('slisp', scalarType)),
  noMap(createSuffixType('seaLevelIsp', scalarType)),
  noMap(createSuffixType('flameout', booleanType)),
  noMap(createArgSuffixType('ispAt', scalarType, scalarType)),
  noMap(createArgSuffixType('maxThrustAt', scalarType, scalarType)),
  noMap(createSuffixType('thrustVectors', listType.apply(vectorType))),
  noMap(createSuffixType('consumeResources', lexiconType)),
);