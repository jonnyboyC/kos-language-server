import {
  createType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { noneType } from '../primitives/none';
import { userListType } from './userList';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { serializableType } from '../primitives/serializeableStructure';
import { Indexer } from '../../types/indexer';
import { CallSignature } from '../../types/callSignature';

export const lexiconType = createType('lexicon');
lexiconType.addSuper(noMap(serializableType));

lexiconType.addIndexer(
  noMap(
    new Indexer(new CallSignature([structureType], structureType), new Map()),
  ),
);

lexiconType.addSuffixes(
  noMap(createArgSuffixType('clear', noneType)),
  noMap(createSuffixType('keys', userListType)),
  noMap(createArgSuffixType('hasKey', booleanType, structureType)),
  noMap(createArgSuffixType('hasValue', booleanType, structureType)),
  noMap(createSuffixType('values', userListType)),
  noMap(createArgSuffixType('copy', lexiconType)),
  noMap(createArgSuffixType('length', scalarType)),
  noMap(createArgSuffixType('remove', booleanType, structureType)),
  noMap(createArgSuffixType('add', noneType, structureType, structureType)),
  noMap(createSetSuffixType('caseSensitive', booleanType)),
  noMap(createSetSuffixType('case', booleanType)),
);
