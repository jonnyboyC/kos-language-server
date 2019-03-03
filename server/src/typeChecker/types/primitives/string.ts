import { IArgumentType, Operator } from '../types';
import { createStructureType, createArgSuffixType } from '../ksType';
import { addOperators, addPrototype, addSuffixes } from '../../typeUitlities';
import { booleanType } from './boolean';
import { scalarType } from './scalar';
import { structureType } from './structure';
import { listType } from '../collections/list';
import { primitiveType } from './primitives';

// ---------- base of string types ---------------------
export const stringType: IArgumentType = createStructureType('string');
addOperators(
  stringType,
  [Operator.plus, stringType],
  [Operator.greaterThan, booleanType],
  [Operator.lessThan, booleanType],
  [Operator.greaterThanEqual, booleanType],
  [Operator.lessThanEqual, booleanType],
  [Operator.equal, booleanType],
  [Operator.notEqual, booleanType],
);
addPrototype(stringType, primitiveType);
addSuffixes(
  stringType,
  createArgSuffixType('length', scalarType),
  createArgSuffixType('substring', stringType, scalarType, scalarType),
  createArgSuffixType('contains', booleanType, stringType),
  createArgSuffixType('endswith', booleanType, stringType),
  createArgSuffixType('findat', scalarType, stringType, scalarType),
  createArgSuffixType('insert', stringType, scalarType, stringType),
  createArgSuffixType('findlastat', scalarType, stringType, scalarType),
  createArgSuffixType('padleft', stringType, scalarType),
  createArgSuffixType('padright', stringType, scalarType),
  createArgSuffixType('remove', stringType, scalarType, scalarType),
  createArgSuffixType('replace', stringType, stringType, stringType),
  createArgSuffixType('split', listType.toConcreteType(stringType), stringType),
  createArgSuffixType('startswith', booleanType, stringType),
  createArgSuffixType('tolower', stringType),
  createArgSuffixType('toupper', stringType),
  createArgSuffixType('trim', stringType),
  createArgSuffixType('trimend', stringType),
  createArgSuffixType('trimstart', stringType),
  createArgSuffixType('matchespattern', booleanType, stringType),
  createArgSuffixType('tonumber', scalarType, structureType),
  createArgSuffixType('toscalar', scalarType, structureType),
  createArgSuffixType('format', stringType, structureType),
);
