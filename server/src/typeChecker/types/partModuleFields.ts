import { IType } from './types';
import {
  createStructureType, createArgSuffixType,
  createSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, stringType } from './primitives';
import { userListType } from './collections/list';
import { partType } from './part';
import { voidType } from './void';

export const partModuleFields: IType = createStructureType('partModuleFields');
addPrototype(partModuleFields, structureType);

addSuffixes(
  partModuleFields,
  createSuffixType('name', stringType),
  createSuffixType('part', partType),
  createSuffixType('allFields', userListType),
  createSuffixType('allFieldNames', userListType),
  createSuffixType('hasField', booleanType),
  createSuffixType('allEvents', userListType),
  createSuffixType('allEventNames', userListType),
  createArgSuffixType('hasEvent', booleanType, stringType),
  createSuffixType('allActions', userListType),
  createSuffixType('allActionNames', userListType),
  createArgSuffixType('hasAction', booleanType, stringType),
  createArgSuffixType('getField', structureType, stringType),
  createArgSuffixType('setField', voidType, structureType, stringType),
  createArgSuffixType('doEvent', voidType, stringType),
  createArgSuffixType('doAction', voidType, stringType, booleanType),
);
