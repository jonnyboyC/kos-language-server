import { IArgumentType } from './types';
import { createStructureType, createArgSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { scalarType, stringType, booleanType } from './primitives/primitives';
import { voidType } from './primitives/void';

export const voiceType: IArgumentType = createStructureType('voice');
addPrototype(voiceType, structureType);

addSuffixes(
  voiceType,
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
