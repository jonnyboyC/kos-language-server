import { createStructureType, createSetSuffixType, createArgSuffixType } from '../../ksType';
import { IArgumentType } from '../../types';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { userDelegateType } from '../../userDelegate';
import { buttonType } from './button';
import { structureType } from '../../primitives/structure';
import { voidType } from '../../primitives/void';
import { userListType } from '../../collections/userList';
import { integarType } from '../../primitives/scalar';
import { booleanType } from '../../primitives/boolean';
import { stringType } from '../../primitives/string';

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
