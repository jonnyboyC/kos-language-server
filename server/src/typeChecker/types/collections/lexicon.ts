import { IArgumentType } from '../types';
import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { voidType } from '../primitives/void';
import { userListType } from './userList';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { serializableStructureType } from '../primitives/serializeableStructure';

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
  createArgSuffixType('add', voidType, structureType, structureType),
  createSetSuffixType('casesensitive', booleanType),
  createSetSuffixType('case', booleanType),
);
