import {
  createType,
  createArgSuffixType,
  createSetSuffixType,
  noMap,
} from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { noneType } from './primitives/none';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';

export const voiceType = createType('voice');
voiceType.addSuper(noMap(structureType));

voiceType.addSuffixes(
  noMap(createSetSuffixType('attack', scalarType)),
  noMap(createSetSuffixType('decay', scalarType)),
  noMap(createSetSuffixType('sustain', scalarType)),
  noMap(createSetSuffixType('release', scalarType)),
  noMap(createSetSuffixType('volume', scalarType)),
  noMap(createSetSuffixType('wave', stringType)),
  noMap(createArgSuffixType('play', noneType, structureType)),
  noMap(createArgSuffixType('stop', noneType)),
  noMap(createSetSuffixType('loop', booleanType)),
  noMap(createSetSuffixType('isPlaying', booleanType)),
  noMap(createSetSuffixType('tempo', scalarType)),
);
