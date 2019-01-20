import { createStructureType, createSetSuffixType } from '../../ksType';
import { IType } from '../../types';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { scalarType } from '../../primitives';
import { userDelegateType } from '../../userDelegate';
import { widgetType } from '../widget';

export const sliderType: IType = createStructureType('slider');
addPrototype(sliderType, widgetType);

addSuffixes(
  sliderType,
  createSetSuffixType('value', scalarType),
  createSetSuffixType('min', scalarType),
  createSetSuffixType('max', scalarType),
  createSetSuffixType('onChange', userDelegateType),
);
