import {
  createStructureType,
  createArgSuffixType,
  createSetSuffixType,
  noMap,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { voidType } from './primitives/void';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';

export const voiceType = createStructureType('voice');
voiceType.addSuper(noMap(structureType));

voiceType.addSuffixes(
  noMap(createSetSuffixType('attack', scalarType)),
  noMap(createSetSuffixType('decay', scalarType)),
  noMap(createSetSuffixType('sustain', scalarType)),
  noMap(createSetSuffixType('release', scalarType)),
  noMap(createSetSuffixType('volume', scalarType)),
  noMap(createSetSuffixType('wave', stringType)),
  noMap(createArgSuffixType('play', voidType, structureType)),
  noMap(createArgSuffixType('stop', voidType)),
  noMap(createSetSuffixType('loop', booleanType)),
  noMap(createSetSuffixType('isPlaying', booleanType)),
  noMap(createSetSuffixType('tempo', scalarType)),
);
