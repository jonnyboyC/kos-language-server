import { addSuffixes, addPrototype, addOperators } from '../../typeUitlities';
import { structureType } from './structure';
import {
  createArgSuffixType,
  createVarSuffixType,
  createVarType,
} from '../../typeCreators';
import { stringType } from './string';
import { booleanType } from './boolean';
import { voidType } from './void';
import { serializableStructureType } from './serializeableStructure';
import { primitiveType } from './primitives';
import { scalarType, integerType, doubleType } from './scalar';
import { listType } from '../collections/list';
import { delegateType } from './delegate';
import { OperatorKind } from '../../types';
import { iterator } from '../../../utilities/constants';
import { enumeratorType } from '../collections/enumerator';

let set = false;

export const primitiveInitializer = () => {
  if (set) {
    return;
  }
  set = true;

  // ------------------ structure ---------------------------
  addSuffixes(
    structureType,
    createArgSuffixType('tostring', stringType),
    createArgSuffixType('hassuffix', booleanType, stringType),
    createArgSuffixType('suffixnames', voidType),
    createArgSuffixType('isserializable', booleanType),
    createArgSuffixType('typename', stringType),
    createArgSuffixType('istype', booleanType, stringType),
    createArgSuffixType('inheritance', stringType),
  );

  // ------------------ serializable structure ---------------------------
  addPrototype(serializableStructureType, structureType);

  // ------------------ primitives ---------------------------
  addPrototype(primitiveType, structureType);

  // ------------------ string ---------------------------
  addOperators(
    stringType,
    {
      operator: OperatorKind.plus,
      other: structureType,
      returnType: stringType,
    },
    {
      operator: OperatorKind.greaterThan,
      other: stringType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.lessThan,
      other: stringType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.greaterThanEqual,
      other: stringType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.lessThanEqual,
      other: stringType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.equal,
      other: stringType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.notEqual,
      other: stringType,
      returnType: booleanType,
    },
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
    createArgSuffixType(
      'split',
      listType.toConcreteType(stringType),
      stringType,
    ),
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
    createArgSuffixType('indexof', stringType, structureType),
    createArgSuffixType('find', stringType, structureType),
    createArgSuffixType('lastindexof', scalarType, stringType),
    createArgSuffixType('findlast', scalarType, stringType),
    createArgSuffixType(iterator, enumeratorType.toConcreteType(stringType)),
  );

  // ------------------ scalar ---------------------------
  addOperators(
    scalarType,
    {
      operator: OperatorKind.plus,
      other: scalarType,
      returnType: scalarType,
    },
    {
      operator: OperatorKind.subtract,
      other: scalarType,
      returnType: scalarType,
    },
    {
      operator: OperatorKind.multiply,
      other: scalarType,
      returnType: scalarType,
    },
    {
      operator: OperatorKind.divide,
      other: scalarType,
      returnType: scalarType,
    },
    {
      operator: OperatorKind.power,
      other: scalarType,
      returnType: scalarType,
    },
    {
      operator: OperatorKind.greaterThan,
      other: scalarType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.lessThan,
      other: scalarType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.greaterThanEqual,
      other: scalarType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.lessThanEqual,
      other: scalarType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.notEqual,
      other: scalarType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.equal,
      other: scalarType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.negate,
      returnType: scalarType,
      other: undefined,
    },
  );
  addPrototype(scalarType, primitiveType);

  // ------------------ integer ---------------------------
  addPrototype(integerType, scalarType);

  // ------------------ double ---------------------------
  addPrototype(doubleType, scalarType);

  // ------------------ delegate ---------------------------
  addPrototype(delegateType, structureType);
  addSuffixes(
    delegateType,
    createVarSuffixType('call', structureType, createVarType(structureType)),
    createVarSuffixType('bind', delegateType, createVarType(structureType)),
    createArgSuffixType('isdead', booleanType),
  );

  // ------------------ boolean ---------------------------
  addOperators(
    booleanType,
    {
      operator: OperatorKind.notEqual,
      other: booleanType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.equal,
      other: booleanType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.and,
      other: booleanType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.or,
      other: booleanType,
      returnType: booleanType,
    },
    {
      operator: OperatorKind.not,
      returnType: booleanType,
      other: undefined,
    },
  );
  addPrototype(booleanType, primitiveType);
};
