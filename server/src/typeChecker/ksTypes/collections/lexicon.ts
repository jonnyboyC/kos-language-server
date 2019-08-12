import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { voidType } from '../primitives/void';
import { userListType } from './userList';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { serializableType } from '../primitives/serializeableStructure';

export const lexiconType = createStructureType('lexicon');
lexiconType.addSuper(noMap(serializableType));

lexiconType.addSuffixes(
  noMap(createArgSuffixType('clear', voidType)),
  noMap(createSuffixType('keys', userListType)),
  noMap(createArgSuffixType('haskey', booleanType, structureType)),
  noMap(createArgSuffixType('hasvalue', booleanType, structureType)),
  noMap(createSuffixType('values', userListType)),
  noMap(createArgSuffixType('copy', lexiconType)),
  noMap(createArgSuffixType('length', scalarType)),
  noMap(createArgSuffixType('remove', structureType, booleanType)),
  noMap(createArgSuffixType('add', voidType, structureType, structureType)),
  noMap(createSetSuffixType('casesensitive', booleanType)),
  noMap(createSetSuffixType('case', booleanType)),
);
