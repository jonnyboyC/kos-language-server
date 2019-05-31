import { IGenericBasicType } from '../types';
import { createArgSuffixType, createGenericBasicType, tType, createGenericArgSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const enumeratorType: IGenericBasicType = createGenericBasicType(
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
