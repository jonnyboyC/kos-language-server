import { createSetSuffixType, createStructureType } from '../../typeCreators';
import { widgetType } from './widget';
import { scalarType } from '../primitives/scalar';

export const spacingType = createStructureType('spacing');
spacingType.addSuper(widgetType);

spacingType.addSuffixes(createSetSuffixType('amount', scalarType));
