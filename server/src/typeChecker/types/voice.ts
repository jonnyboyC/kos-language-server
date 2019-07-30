import {
  createStructureType,
  createArgSuffixType,
  createSetSuffixType,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { voidType } from './primitives/void';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';

export const voiceType = createStructureType('voice');
voiceType.addSuper(structureType);

voiceType.addSuffixes(
  createSetSuffixType('attack', scalarType),
  createSetSuffixType('decay', scalarType),
  createSetSuffixType('sustain', scalarType),
  createSetSuffixType('release', scalarType),
  createSetSuffixType('volume', scalarType),
  createSetSuffixType('wave', stringType),
  createArgSuffixType('play', voidType, structureType),
  createArgSuffixType('stop', voidType),
  createSetSuffixType('loop', booleanType),
  createSetSuffixType('isPlaying', booleanType),
  createSetSuffixType('tempo', scalarType),
);
