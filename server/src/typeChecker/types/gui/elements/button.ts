import { createStructureType, createSetSuffixType } from '../../ksType';
import { IType } from '../../types';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { booleanType } from '../../primitives';
import { userDelegateType } from '../../userDelegate';
import { labelType } from './label';

export const buttonType: IType = createStructureType('button');
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
