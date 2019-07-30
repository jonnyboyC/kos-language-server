import {
  createStructureType,
  createSetSuffixType,
} from '../../../typeCreators';
import { userDelegateType } from '../../userDelegate';
import { labelType } from './label';
import { booleanType } from '../../primitives/boolean';

export const textFieldType = createStructureType('textField');
textFieldType.addSuper(labelType);

textFieldType.addSuffixes(
  createSetSuffixType('changed', booleanType),
  createSetSuffixType('confirmed', booleanType),
  createSetSuffixType('onChange', userDelegateType),
  createSetSuffixType('onConfirm', userDelegateType),
);
