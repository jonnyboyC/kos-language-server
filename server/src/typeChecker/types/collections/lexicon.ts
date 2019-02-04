import { IArgumentType } from '../types';
import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType, serializableStructureType } from '../structure';
import { booleanType, scalarType } from '../primitives';
import { voidType } from '../void';
import { userListType } from './list';

export const lexiconType: IArgumentType = createStructureType('lexicon');
addPrototype(lexiconType, serializableStructureType);

addSuffixes(
  lexiconType,
  createArgSuffixType('clear', voidType),
  createSuffixType('keys', userListType),
  createArgSuffixType('haskey', booleanType, structureType),
  createArgSuffixType('hasvalue', booleanType, structureType),
  createSuffixType('values', userListType),
  createArgSuffixType('copy', lexiconType),
  createArgSuffixType('length', scalarType),
  createArgSuffixType('remove', structureType, booleanType),
  createArgSuffixType('add', structureType, structureType),
  createSetSuffixType('casesensitive', booleanType),
  createSetSuffixType('case', booleanType),
);
