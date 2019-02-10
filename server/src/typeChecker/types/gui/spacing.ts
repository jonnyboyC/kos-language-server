import { IArgumentType } from '../types';
import {
  createSetSuffixType, createStructureType,
} from '../ksType';
import { scalarType } from '../primitives';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { widgetType } from './widget';

export const spacingType: IArgumentType = createStructureType('spacing');
addPrototype(spacingType, widgetType);

addSuffixes(
  spacingType,
  createSetSuffixType('amount', scalarType),
);
