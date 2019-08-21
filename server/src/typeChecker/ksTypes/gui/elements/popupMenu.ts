import {
  createType,
  createSetSuffixType,
  createArgSuffixType,
  noMap,
} from '../../../typeCreators';
import { userDelegateType } from '../../userDelegate';
import { buttonType } from './button';
import { structureType } from '../../primitives/structure';
import { voidType } from '../../primitives/void';
import { userListType } from '../../collections/userList';
import { integerType } from '../../primitives/scalar';
import { booleanType } from '../../primitives/boolean';
import { stringType } from '../../primitives/string';

export const popupMenuType = createType('popupMenu');
popupMenuType.addSuper(noMap(buttonType));

popupMenuType.addSuffixes(
  noMap(createSetSuffixType('option', userListType)),
  noMap(createArgSuffixType('addOption', voidType, structureType)),
  noMap(createSetSuffixType('value', structureType)),
  noMap(createSetSuffixType('index', integerType)),
  noMap(createArgSuffixType('clear', voidType)),
  noMap(createSetSuffixType('changed', booleanType)),
  noMap(createSetSuffixType('maxVisible', integerType)),
  noMap(createSetSuffixType('onChange', userDelegateType)),
  noMap(createSetSuffixType('optionSuffix', stringType)),
);
