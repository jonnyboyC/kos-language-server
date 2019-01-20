import { createStructureType, createSetSuffixType, createArgSuffixType } from '../../ksType';
import { IType } from '../../types';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { booleanType, integarType, stringType } from '../../primitives';
import { userDelegateType } from '../../userDelegate';
import { buttonType } from './button';
import { userListType } from '../../collections/list';
import { structureType } from '../../structure';
import { voidType } from '../../void';

export const popupMenuType: IType = createStructureType('popupMenu');
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
