import {
  createType,
  createSetSuffixType,
  noMap,
} from '../../../typeCreators';
import { userDelegateType } from '../../userDelegate';
import { labelType } from './label';
import { booleanType } from '../../primitives/boolean';

export const textFieldType = createType('textField');
textFieldType.addSuper(noMap(labelType));

textFieldType.addSuffixes(
  noMap(createSetSuffixType('changed', booleanType)),
  noMap(createSetSuffixType('confirmed', booleanType)),
  noMap(createSetSuffixType('onChange', userDelegateType)),
  noMap(createSetSuffixType('onConfirm', userDelegateType)),
);
