import { ArgumentType } from '../types';
import { createSetSuffixType, createStructureType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { widgetType } from './widget';
import { scalarType } from '../primitives/scalar';

export const spacingType: ArgumentType = createStructureType('spacing');
addPrototype(spacingType, widgetType);

addSuffixes(
  spacingType,
  createSetSuffixType('amount', scalarType),
);
