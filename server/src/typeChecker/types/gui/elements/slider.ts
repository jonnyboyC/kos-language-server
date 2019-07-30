import {
  createStructureType,
  createSetSuffixType,
} from '../../../typeCreators';
import { userDelegateType } from '../../userDelegate';
import { widgetType } from '../widget';
import { scalarType } from '../../primitives/scalar';

export const sliderType = createStructureType('slider');
sliderType.addSuper(widgetType);

sliderType.addSuffixes(
  createSetSuffixType('value', scalarType),
  createSetSuffixType('min', scalarType),
  createSetSuffixType('max', scalarType),
  createSetSuffixType('onChange', userDelegateType),
);
