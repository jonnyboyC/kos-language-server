import {
  createStructureType,
  createSetSuffixType,
  noMap,
} from '../../../typeCreators';
import { userDelegateType } from '../../userDelegate';
import { labelType } from './label';
import { booleanType } from '../../primitives/boolean';

export const buttonType = createStructureType('button');
buttonType.addSuper(noMap(labelType));

buttonType.addSuffixes(
  noMap(createSetSuffixType('pressed', booleanType)),
  noMap(createSetSuffixType('takePress', booleanType)),
  noMap(createSetSuffixType('toggle', booleanType)),
  noMap(createSetSuffixType('exclusive', booleanType)),
  noMap(createSetSuffixType('onToggle', userDelegateType)),
  noMap(createSetSuffixType('onClick', userDelegateType)),
);
