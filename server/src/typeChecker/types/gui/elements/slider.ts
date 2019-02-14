import { createStructureType, createSetSuffixType } from '../../ksType';
import { IArgumentType } from '../../types';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { userDelegateType } from '../../userDelegate';
import { widgetType } from '../widget';
import { scalarType } from '../../primitives/scalar';

export const sliderType: IArgumentType = createStructureType('slider');
addPrototype(sliderType, widgetType);

addSuffixes(
  sliderType,
  createSetSuffixType('value', scalarType),
  createSetSuffixType('min', scalarType),
  createSetSuffixType('max', scalarType),
  createSetSuffixType('onChange', userDelegateType),
);
