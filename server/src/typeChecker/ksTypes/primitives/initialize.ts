import { structureType } from './structure';
import {
  createArgSuffixType,
  createVarSuffixType,
  createVarType,
  noMap,
} from '../../typeCreators';
import { stringType } from './string';
import { booleanType } from './boolean';
import { voidType } from './void';
import { serializableType } from './serializeableStructure';
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
    noMap(createArgSuffixType('tostring', stringType)),
    noMap(createArgSuffixType('hassuffix', booleanType, stringType)),
    noMap(createArgSuffixType('suffixnames', voidType)),
    noMap(createArgSuffixType('isserializable', booleanType)),
    noMap(createArgSuffixType('typename', stringType)),
    noMap(createArgSuffixType('istype', booleanType, stringType)),
    noMap(createArgSuffixType('inheritance', stringType)),
  );

  // ------------------ serializable structure ---------------------------
  serializableType.addSuper(noMap(structureType));

  // ------------------ primitives ---------------------------
  primitiveType.addSuper(noMap(structureType));

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

  stringType.addSuper(noMap(primitiveType));
  stringType.addSuffixes(
    noMap(createArgSuffixType('length', scalarType)),
    noMap(createArgSuffixType('substring', stringType, scalarType, scalarType)),
    noMap(createArgSuffixType('contains', booleanType, stringType)),
    noMap(createArgSuffixType('endswith', booleanType, stringType)),
    noMap(createArgSuffixType('findat', scalarType, stringType, scalarType)),
    noMap(createArgSuffixType('insert', stringType, scalarType, stringType)),
    noMap(
      createArgSuffixType('findlastat', scalarType, stringType, scalarType),
    ),
    noMap(createArgSuffixType('padleft', stringType, scalarType)),
    noMap(createArgSuffixType('padright', stringType, scalarType)),
    noMap(createArgSuffixType('remove', stringType, scalarType, scalarType)),
    noMap(createArgSuffixType('replace', stringType, stringType, stringType)),
    noMap(
      createArgSuffixType('split', listType.toConcrete(stringType), stringType),
    ),
    noMap(createArgSuffixType('startswith', booleanType, stringType)),
    noMap(createArgSuffixType('tolower', stringType)),
    noMap(createArgSuffixType('toupper', stringType)),
    noMap(createArgSuffixType('trim', stringType)),
    noMap(createArgSuffixType('trimend', stringType)),
    noMap(createArgSuffixType('trimstart', stringType)),
    noMap(createArgSuffixType('matchespattern', booleanType, stringType)),
    noMap(createArgSuffixType('tonumber', scalarType, structureType)),
    noMap(createArgSuffixType('toscalar', scalarType, structureType)),
    noMap(createArgSuffixType('format', stringType, structureType)),
    noMap(createArgSuffixType('indexof', stringType, structureType)),
    noMap(createArgSuffixType('find', stringType, structureType)),
    noMap(createArgSuffixType('lastindexof', scalarType, stringType)),
    noMap(createArgSuffixType('findlast', scalarType, stringType)),
    noMap(createArgSuffixType(iterator, enumeratorType.toConcrete(stringType))),
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
  scalarType.addSuper(noMap(primitiveType));

  // ------------------ integer ---------------------------
  integerType.addSuper(noMap(scalarType));

  // ------------------ double ---------------------------
  doubleType.addSuper(noMap(scalarType));

  // ------------------ delegate ---------------------------
  delegateType.addSuper(noMap(structureType));
  delegateType.addSuffixes(
    noMap(
      createVarSuffixType('call', structureType, createVarType(structureType)),
    ),
    noMap(
      createVarSuffixType('bind', delegateType, createVarType(structureType)),
    ),
    noMap(createArgSuffixType('isdead', booleanType)),
  );

  // ------------------ boolean ---------------------------
  booleanType.addOperators(
    new Operator(OperatorKind.notEqual, booleanType, booleanType),
    new Operator(OperatorKind.equal, booleanType, booleanType),
    new Operator(OperatorKind.and, booleanType, booleanType),
    new Operator(OperatorKind.or, booleanType, booleanType),
  );
  booleanType.addCoercion(scalarType, stringType);
  booleanType.addSuper(noMap(primitiveType));
};
