import { IType } from './types';
import { createStructureType, createArgSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { scalarType, stringType, booleanType } from './primitives';
import { voidType } from './void';

export const voiceType: IType = createStructureType('voice');
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
