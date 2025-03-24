import {
  createType,
  createSuffixType,
  noMap,
  createArgSuffixType,
} from '../utilities/typeCreators';
import { doubleType } from './primitives/scalar';
import { structureType } from './primitives/structure';
import { noneType } from './primitives/none';

export const deltaVType = createType('deltaV');
deltaVType.addSuper(noMap(structureType));

deltaVType.addSuffixes(
  noMap(createSuffixType('current', doubleType)),
  noMap(createSuffixType('asl', doubleType)),
  noMap(createSuffixType('vacuum', doubleType)),
  noMap(createSuffixType('duration', doubleType)),
  noMap(createArgSuffixType('forceCalc', noneType)),
);
