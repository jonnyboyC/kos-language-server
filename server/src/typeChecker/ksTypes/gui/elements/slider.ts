import {
  createType,
  createSetSuffixType,
  noMap,
} from '../../../typeCreators';
import { userDelegateType } from '../../userDelegate';
import { widgetType } from '../widget';
import { scalarType } from '../../primitives/scalar';

export const sliderType = createType('slider');
sliderType.addSuper(noMap(widgetType));

sliderType.addSuffixes(
  noMap(createSetSuffixType('value', scalarType)),
  noMap(createSetSuffixType('min', scalarType)),
  noMap(createSetSuffixType('max', scalarType)),
  noMap(createSetSuffixType('onChange', userDelegateType)),
);
