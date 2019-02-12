import { createStructureType, createSetSuffixType, createArgSuffixType } from '../../ksType';
import { IArgumentType } from '../../types';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { booleanType, integarType, stringType } from '../../primitives/primitives';
import { userDelegateType } from '../../userDelegate';
import { buttonType } from './button';
import { userListType } from '../../collections/list';
import { structureType } from '../../primitives/structure';
import { voidType } from '../../primitives/void';

export const popupMenuType: IArgumentType = createStructureType('popupMenu');
addPrototype(popupMenuType, buttonType);

addSuffixes(
  popupMenuType,
  createSetSuffixType('option', userListType),
  createArgSuffixType('addOption', voidType, structureType),
  createSetSuffixType('value', structureType),
  createSetSuffixType('index', integarType),
  createArgSuffixType('clear', voidType),
  createSetSuffixType('changed', booleanType),
  createSetSuffixType('maxVisible', integarType),
  createSetSuffixType('onChange', userDelegateType),
  createSetSuffixType('optionSuffix', stringType),
);
