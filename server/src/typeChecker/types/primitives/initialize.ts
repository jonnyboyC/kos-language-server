import { addSuffixes, addPrototype, addOperators } from '../../typeUitlities';
import { structureType } from './structure';
import { createArgSuffixType, createVarSuffixType, createVarType } from '../../typeCreators';
import { stringType } from './string';
import { booleanType } from './boolean';
import { voidType } from './void';
import { serializableStructureType } from './serializeableStructure';
import { primitiveType } from './primitives';
import { scalarType, integarType, doubleType } from './scalar';
import { listType } from '../collections/list';
import { delegateType } from './delegate';
import { OperatorKind } from '../../types';

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
    [OperatorKind.plus, stringType],
    [OperatorKind.greaterThan, booleanType],
    [OperatorKind.lessThan, booleanType],
    [OperatorKind.greaterThanEqual, booleanType],
    [OperatorKind.lessThanEqual, booleanType],
    [OperatorKind.equal, booleanType],
    [OperatorKind.notEqual, booleanType],
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

  // ------------------ scalar ---------------------------
  addOperators(
    scalarType,
    [OperatorKind.plus, scalarType],
    [OperatorKind.subtract, scalarType],
    [OperatorKind.multiply, scalarType],
    [OperatorKind.divide, scalarType],
    [OperatorKind.power, scalarType],
    [OperatorKind.greaterThan, booleanType],
    [OperatorKind.lessThan, booleanType],
    [OperatorKind.greaterThanEqual, booleanType],
    [OperatorKind.lessThanEqual, booleanType],
    [OperatorKind.notEqual, booleanType],
    [OperatorKind.equal, booleanType],
  );
  addPrototype(scalarType, primitiveType);

  // ------------------ integar ---------------------------
  addPrototype(integarType, scalarType);

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
    [OperatorKind.notEqual, booleanType],
    [OperatorKind.equal, booleanType],
  );
  addPrototype(booleanType, primitiveType);
};
