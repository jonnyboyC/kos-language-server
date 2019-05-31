import { createStructureType, createSetSuffixType } from "../../../typeCreators";
import { ArgumentType } from '../../types';
import { addPrototype, addSuffixes } from '../../../typeUitlities';
import { userDelegateType } from '../../userDelegate';
import { labelType } from './label';
import { booleanType } from '../../primitives/boolean';

export const buttonType: ArgumentType = createStructureType('button');
addPrototype(buttonType, labelType);

addSuffixes(
  buttonType,
  createSetSuffixType('pressed', booleanType),
  createSetSuffixType('takePress', booleanType),
  createSetSuffixType('toggle', booleanType),
  createSetSuffixType('exclusive', booleanType),
  createSetSuffixType('onToggle', userDelegateType),
  createSetSuffixType('onClick', userDelegateType),
);
