import { IArgumentType } from './types';
import {
  createStructureType, createArgSuffixType,
  createSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { booleanType, stringType } from './primitives/primitives';
import { userListType } from './collections/list';
import { partType } from './part';
import { voidType } from './primitives/void';

export const partModuleFields: IArgumentType = createStructureType('partModuleFields');
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
