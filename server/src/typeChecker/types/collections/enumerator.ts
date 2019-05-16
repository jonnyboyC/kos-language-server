import { IGenericArgumentType } from '../types';
import {
  createArgSuffixType,
  createGenericStructureType,
  tType,
  createGenericArgSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const enumeratorType: IGenericArgumentType = createGenericStructureType(
  'enumerator',
);
addPrototype(enumeratorType, structureType);

addSuffixes(
  enumeratorType,
  createArgSuffixType('next', booleanType),
  createArgSuffixType('atend', booleanType),
  createArgSuffixType('index', scalarType),
  createGenericArgSuffixType('value', tType),
);
