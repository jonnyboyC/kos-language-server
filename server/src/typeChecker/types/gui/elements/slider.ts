import { createStructureType, createSetSuffixType } from "../../../typeCreators";
import { ArgumentType } from '../../types';
import { addPrototype, addSuffixes } from '../../../typeUitlities';
import { userDelegateType } from '../../userDelegate';
import { widgetType } from '../widget';
import { scalarType } from '../../primitives/scalar';

export const sliderType: ArgumentType = createStructureType('slider');
addPrototype(sliderType, widgetType);

addSuffixes(
  sliderType,
  createSetSuffixType('value', scalarType),
  createSetSuffixType('min', scalarType),
  createSetSuffixType('max', scalarType),
  createSetSuffixType('onChange', userDelegateType),
);
