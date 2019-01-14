import { IType } from '../types';
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
import { listType } from './list';

export const lexiconType: IType = createStructureType('lexicon');
addPrototype(lexiconType, serializableStructureType);

addSuffixes(
  lexiconType,
  createArgSuffixType('clear', voidType),
  createSuffixType('keys', listType.toConcreteType(structureType)),
  createArgSuffixType('haskey', booleanType, structureType),
  createArgSuffixType('hasvalue', booleanType, structureType),
  createSuffixType('values', listType.toConcreteType(structureType)),
  createArgSuffixType('copy', lexiconType),
  createArgSuffixType('length', scalarType),
  createArgSuffixType('remove', structureType, booleanType),
  createArgSuffixType('add', structureType, structureType),
  createSetSuffixType('casesensitive', booleanType),
  createSetSuffixType('case', booleanType),
);
