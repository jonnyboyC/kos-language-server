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
import { Operator } from '../../operator';

let set = false;

export const primitiveInitializer = () => {
  if (set) {
    return;
  }
  set = true;

  // ------------------ structure ---------------------------
  structureType.addSuffixes(
    createArgSuffixType('tostring', stringType),
    createArgSuffixType('hassuffix', booleanType, stringType),
    createArgSuffixType('suffixnames', voidType),
    createArgSuffixType('isserializable', booleanType),
    createArgSuffixType('typename', stringType),
    createArgSuffixType('istype', booleanType, stringType),
    createArgSuffixType('inheritance', stringType),
  );

  // ------------------ serializable structure ---------------------------
  serializableStructureType.addSuper(structureType);

  // ------------------ primitives ---------------------------
  primitiveType.addSuper(structureType);

  // ------------------ string ---------------------------
  stringType.addOperators(
    new Operator(OperatorKind.plus, stringType, stringType),
    new Operator(OperatorKind.greaterThan, booleanType, stringType),
    new Operator(OperatorKind.lessThan, booleanType, stringType),
    new Operator(OperatorKind.greaterThanEqual, booleanType, stringType),
    new Operator(OperatorKind.lessThanEqual, booleanType, stringType),
    new Operator(OperatorKind.equal, booleanType, stringType),
    new Operator(OperatorKind.notEqual, booleanType, stringType),
  );
  stringType.addCoercion(structureType);

  stringType.addSuper(primitiveType);
  stringType.addSuffixes(
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
  scalarType.addOperators(
    new Operator(OperatorKind.plus, scalarType, scalarType),
    new Operator(OperatorKind.subtract, scalarType, scalarType),
    new Operator(OperatorKind.multiply, scalarType, scalarType),
    new Operator(OperatorKind.divide, scalarType, scalarType),
    new Operator(OperatorKind.power, scalarType, scalarType),
    new Operator(OperatorKind.greaterThan, booleanType, scalarType),
    new Operator(OperatorKind.lessThan, booleanType, scalarType),
    new Operator(OperatorKind.greaterThanEqual, booleanType, scalarType),
    new Operator(OperatorKind.lessThanEqual, booleanType, scalarType),
    new Operator(OperatorKind.notEqual, booleanType, scalarType),
    new Operator(OperatorKind.equal, booleanType, scalarType),
    new Operator(OperatorKind.negate, scalarType),
  );
  scalarType.addCoercion(booleanType, stringType);
  scalarType.addSuper(primitiveType);

  // ------------------ integer ---------------------------
  integerType.addSuper(scalarType);

  // ------------------ double ---------------------------
  doubleType.addSuper(scalarType);

  // ------------------ delegate ---------------------------
  delegateType.addSuper(structureType);
  delegateType.addSuffixes(
    createVarSuffixType('call', structureType, createVarType(structureType)),
    createVarSuffixType('bind', delegateType, createVarType(structureType)),
    createArgSuffixType('isdead', booleanType),
  );

  // ------------------ boolean ---------------------------
  booleanType.addOperators(
    new Operator(OperatorKind.notEqual, booleanType, booleanType),
    new Operator(OperatorKind.equal, booleanType, booleanType),
    new Operator(OperatorKind.and, booleanType, booleanType),
    new Operator(OperatorKind.or, booleanType, booleanType),
  );
  booleanType.addCoercion(scalarType, stringType);
  booleanType.addSuper(primitiveType);
};
