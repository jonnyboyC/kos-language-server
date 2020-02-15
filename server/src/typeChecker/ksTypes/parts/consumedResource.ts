import {
  createType,
  createSuffixType,
  noMap,
} from '../../utilities/typeCreators';
import { structureType } from '../primitives/structure';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';

export const aggregateResourceType = createType('consumedResource');
aggregateResourceType.addSuper(noMap(structureType));

aggregateResourceType.addSuffixes(
  noMap(createSuffixType('name', stringType)),
  noMap(createSuffixType('density', scalarType)),
  noMap(createSuffixType('fuelFlow', scalarType)),
  noMap(createSuffixType('maxFuelFlow', scalarType)),
  noMap(createSuffixType('requiredFlow', scalarType)),
  noMap(createSuffixType('massFlow', scalarType)),
  noMap(createSuffixType('maxMassFlow', scalarType)),
  noMap(createSuffixType('ratio', scalarType)),
  noMap(createSuffixType('amount', scalarType)),
  noMap(createSuffixType('capacity', scalarType)),
);
