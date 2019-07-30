import {
  createStructureType,
  createSetSuffixType,
} from '../../../typeCreators';
import { userDelegateType } from '../../userDelegate';
import { labelType } from './label';
import { booleanType } from '../../primitives/boolean';

export const buttonType = createStructureType('button');
buttonType.addSuper(labelType);

buttonType.addSuffixes(
  createSetSuffixType('pressed', booleanType),
  createSetSuffixType('takePress', booleanType),
  createSetSuffixType('toggle', booleanType),
  createSetSuffixType('exclusive', booleanType),
  createSetSuffixType('onToggle', userDelegateType),
  createSetSuffixType('onClick', userDelegateType),
);
