import {
  createSetSuffixType,
  createStructureType,
  noMap,
} from '../../typeCreators';
import { widgetType } from './widget';
import { scalarType } from '../primitives/scalar';

export const spacingType = createStructureType('spacing');
spacingType.addSuper(noMap(widgetType));

spacingType.addSuffixes(noMap(createSetSuffixType('amount', scalarType)));
