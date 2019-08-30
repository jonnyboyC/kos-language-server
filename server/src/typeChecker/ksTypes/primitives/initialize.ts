import { structureType } from './structure';
import {
  createArgSuffixType,
  createVarSuffixType,
  createVarType,
  noMap,
} from '../../utilities/typeCreators';
import { stringType } from './string';
import { booleanType } from './boolean';
import { serializableType } from './serializeableStructure';
import { primitiveType } from './primitives';
import { scalarType, integerType, doubleType } from './scalar';
import { listType } from '../collections/list';
import { delegateType } from './delegate';
import { OperatorKind } from '../../types';
import { iterator } from '../../../utilities/constants';
import { enumeratorType } from '../collections/enumerator';
import { Operator } from '../../types/operator';
import { Indexer } from '../../types/indexer';
import { CallSignature } from '../../types/callSignature';

let set = false;

export const primitiveInitializer = () => {
  if (set) {
    return;
  }
  set = true;

  // ------------------ structure ---------------------------
  structureType.addSuffixes(
    noMap(createArgSuffixType('toString', stringType)),
    noMap(createArgSuffixType('hasSuffix', booleanType, stringType)),
    noMap(createArgSuffixType('suffixNames', listType.apply(stringType))),
    noMap(createArgSuffixType('isSerializable', booleanType)),
    noMap(createArgSuffixType('typeName', stringType)),
    noMap(createArgSuffixType('isType', booleanType, stringType)),
    noMap(createArgSuffixType('inheritance', stringType)),
  );

  // ------------------ serializable structure ---------------------------
  serializableType.addSuper(noMap(structureType));

  // ------------------ primitives ---------------------------
  primitiveType.addSuper(noMap(structureType));

  // ------------------ string ---------------------------
  stringType.addOperators(
    new Operator(stringType, OperatorKind.plus, stringType, stringType),
    new Operator(stringType, OperatorKind.greaterThan, booleanType, stringType),
    new Operator(stringType, OperatorKind.lessThan, booleanType, stringType),
    new Operator(
      stringType,
      OperatorKind.greaterThanEqual,
      booleanType,
      stringType,
    ),
    new Operator(
      stringType,
      OperatorKind.lessThanEqual,
      booleanType,
      stringType,
    ),
    new Operator(stringType, OperatorKind.equal, booleanType, stringType),
    new Operator(stringType, OperatorKind.notEqual, booleanType, stringType),
  );
  stringType.addCoercion(structureType);
  stringType.addSuper(noMap(primitiveType));
  stringType.addIndexer(
    noMap(new Indexer(new CallSignature([scalarType], stringType), new Map())),
  );

  stringType.addSuffixes(
    noMap(createArgSuffixType('length', scalarType)),
    noMap(createArgSuffixType('substring', stringType, scalarType, scalarType)),
    noMap(createArgSuffixType('contains', booleanType, stringType)),
    noMap(createArgSuffixType('endsWith', booleanType, stringType)),
    noMap(createArgSuffixType('findAt', scalarType, stringType, scalarType)),
    noMap(createArgSuffixType('insert', stringType, scalarType, stringType)),
    noMap(
      createArgSuffixType('findLastAt', scalarType, stringType, scalarType),
    ),
    noMap(createArgSuffixType('padLeft', stringType, scalarType)),
    noMap(createArgSuffixType('padRight', stringType, scalarType)),
    noMap(createArgSuffixType('remove', stringType, scalarType, scalarType)),
    noMap(createArgSuffixType('replace', stringType, stringType, stringType)),
    noMap(createArgSuffixType('split', listType.apply(stringType), stringType)),
    noMap(createArgSuffixType('startsWith', booleanType, stringType)),
    noMap(createArgSuffixType('toLower', stringType)),
    noMap(createArgSuffixType('toUpper', stringType)),
    noMap(createArgSuffixType('trim', stringType)),
    noMap(createArgSuffixType('trimEnd', stringType)),
    noMap(createArgSuffixType('trimStart', stringType)),
    noMap(createArgSuffixType('matchesPattern', booleanType, stringType)),
    noMap(
      createVarSuffixType('toNumber', scalarType, createVarType(structureType)),
    ),
    noMap(
      createVarSuffixType('toScalar', scalarType, createVarType(structureType)),
    ),
    noMap(
      createVarSuffixType('format', stringType, createVarType(structureType)),
    ),
    noMap(createArgSuffixType('indexOf', scalarType, stringType)),
    noMap(createArgSuffixType('find', scalarType, stringType)),
    noMap(createArgSuffixType('lastIndexOf', scalarType, stringType)),
    noMap(createArgSuffixType('findLast', scalarType, stringType)),
    noMap(createArgSuffixType(iterator, enumeratorType.apply(stringType))),
  );

  // ------------------ scalar ---------------------------
  scalarType.addOperators(
    new Operator(scalarType, OperatorKind.plus, scalarType, scalarType),
    new Operator(scalarType, OperatorKind.subtract, scalarType, scalarType),
    new Operator(scalarType, OperatorKind.multiply, scalarType, scalarType),
    new Operator(scalarType, OperatorKind.divide, scalarType, scalarType),
    new Operator(scalarType, OperatorKind.power, scalarType, scalarType),
    new Operator(scalarType, OperatorKind.greaterThan, booleanType, scalarType),
    new Operator(scalarType, OperatorKind.lessThan, booleanType, scalarType),
    new Operator(
      scalarType,
      OperatorKind.greaterThanEqual,
      booleanType,
      scalarType,
    ),
    new Operator(
      scalarType,
      OperatorKind.lessThanEqual,
      booleanType,
      scalarType,
    ),
    new Operator(scalarType, OperatorKind.notEqual, booleanType, scalarType),
    new Operator(scalarType, OperatorKind.equal, booleanType, scalarType),
    new Operator(scalarType, OperatorKind.negate, scalarType),
  );
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
    new Operator(booleanType, OperatorKind.notEqual, booleanType, booleanType),
    new Operator(booleanType, OperatorKind.equal, booleanType, booleanType),
    new Operator(booleanType, OperatorKind.and, booleanType, booleanType),
    new Operator(booleanType, OperatorKind.or, booleanType, booleanType),
  );
  booleanType.addCoercion(structureType);
  booleanType.addSuper(noMap(primitiveType));
};
