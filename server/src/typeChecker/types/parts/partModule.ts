import { ArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { partType } from './part';
import { voidType } from '../primitives/void';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { listType } from '../collections/list';

export const partModuleType: ArgumentType = createStructureType('partModule');
addPrototype(partModuleType, structureType);

addSuffixes(
  partModuleType,
  createSuffixType('name', stringType),
  createSuffixType('part', partType),
  createSuffixType('allFields', listType.toConcreteType(stringType)),
  createSuffixType('allFieldNames', listType.toConcreteType(stringType)),
  createSuffixType('hasField', booleanType),
  createSuffixType('allEvents', listType.toConcreteType(stringType)),
  createSuffixType('allEventNames', listType.toConcreteType(stringType)),
  createArgSuffixType('hasEvent', booleanType, stringType),
  createSuffixType('allActions', listType.toConcreteType(stringType)),
  createSuffixType('allActionNames', listType.toConcreteType(stringType)),
  createArgSuffixType('hasAction', booleanType, stringType),
  createArgSuffixType('getField', structureType, stringType),
  createArgSuffixType('setField', voidType, structureType, stringType),
  createArgSuffixType('doEvent', voidType, stringType),
  createArgSuffixType('doAction', voidType, stringType, booleanType),
);
