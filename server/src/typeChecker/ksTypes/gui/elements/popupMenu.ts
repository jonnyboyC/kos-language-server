import {
  createType,
  createSetSuffixType,
  createArgSuffixType,
  noMap,
} from '../../../utilities/typeCreators';
import { userDelegateType } from '../../userDelegate';
import { buttonType } from './button';
import { structureType } from '../../primitives/structure';
import { noneType } from '../../primitives/none';
import { userListType } from '../../collections/userList';
import { integerType } from '../../primitives/scalar';
import { booleanType } from '../../primitives/boolean';
import { stringType } from '../../primitives/string';

export const popupMenuType = createType('popupMenu');
popupMenuType.addSuper(noMap(buttonType));

popupMenuType.addSuffixes(
  noMap(createSetSuffixType('option', userListType)),
  noMap(createArgSuffixType('addOption', noneType, structureType)),
  noMap(createSetSuffixType('value', structureType)),
  noMap(createSetSuffixType('index', integerType)),
  noMap(createArgSuffixType('clear', noneType)),
  noMap(createSetSuffixType('changed', booleanType)),
  noMap(createSetSuffixType('maxVisible', integerType)),
  noMap(createSetSuffixType('onChange', userDelegateType)),
  noMap(createSetSuffixType('optionSuffix', stringType)),
);
