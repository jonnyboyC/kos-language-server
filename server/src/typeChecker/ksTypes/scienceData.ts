import { createType, createArgSuffixType, noMap } from '../utilities/typeCreators';
import { scalarType } from './primitives/scalar';
import { structureType } from './primitives/structure';
import { stringType } from './primitives/string';

export const scienceDataType = createType('scienceData');
scienceDataType.addSuper(noMap(structureType));

scienceDataType.addSuffixes(
  noMap(createArgSuffixType('dataAmount', scalarType)),
  noMap(createArgSuffixType('scienceValue', scalarType)),
  noMap(createArgSuffixType('transmitValue', scalarType)),
  noMap(createArgSuffixType('title', stringType)),
);
