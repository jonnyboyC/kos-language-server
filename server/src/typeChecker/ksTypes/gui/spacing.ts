import {
  createSetSuffixType,
  createType,
  noMap,
} from '../../typeCreators';
import { widgetType } from './widget';
import { scalarType } from '../primitives/scalar';

export const spacingType = createType('spacing');
spacingType.addSuper(noMap(widgetType));

spacingType.addSuffixes(noMap(createSetSuffixType('amount', scalarType)));
