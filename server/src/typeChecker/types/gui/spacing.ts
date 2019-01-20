import { IType } from '../types';
import {
  createSetSuffixType, createStructureType,
} from '../ksType';
import { scalarType } from '../primitives';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { widgetType } from './widget';

export const spacingType: IType = createStructureType('spacing');
addPrototype(spacingType, widgetType);

addSuffixes(
  spacingType,
  createSetSuffixType('amount', scalarType),
);
