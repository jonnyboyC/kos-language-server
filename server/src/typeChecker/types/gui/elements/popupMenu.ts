import {
  createStructureType,
  createSetSuffixType,
  createArgSuffixType,
} from '../../../typeCreators';
import { ArgumentType } from '../../types';
import { addPrototype, addSuffixes } from '../../../typeUtilities';
import { userDelegateType } from '../../userDelegate';
import { buttonType } from './button';
import { structureType } from '../../primitives/structure';
import { voidType } from '../../primitives/void';
import { userListType } from '../../collections/userList';
import { integerType } from '../../primitives/scalar';
import { booleanType } from '../../primitives/boolean';
import { stringType } from '../../primitives/string';

export const popupMenuType: ArgumentType = createStructureType('popupMenu');
addPrototype(popupMenuType, buttonType);

addSuffixes(
  popupMenuType,
  createSetSuffixType('option', userListType),
  createArgSuffixType('addOption', voidType, structureType),
  createSetSuffixType('value', structureType),
  createSetSuffixType('index', integerType),
  createArgSuffixType('clear', voidType),
  createSetSuffixType('changed', booleanType),
  createSetSuffixType('maxVisible', integerType),
  createSetSuffixType('onChange', userDelegateType),
  createSetSuffixType('optionSuffix', stringType),
);
