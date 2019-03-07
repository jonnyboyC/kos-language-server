import { IArgumentType } from '../types';
import {
  createSetSuffixType, createStructureType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { widgetType } from './widget';
import { scalarType } from '../primitives/scalar';

export const spacingType: IArgumentType = createStructureType('spacing');
addPrototype(spacingType, widgetType);

addSuffixes(
  spacingType,
  createSetSuffixType('amount', scalarType),
);
