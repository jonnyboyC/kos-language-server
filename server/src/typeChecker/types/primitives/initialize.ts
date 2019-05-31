import { addSuffixes, addPrototype, addOperators } from '../../typeUitlities';
import { structureType } from './structure';
import { createArgSuffixType, createVarSuffixType, createVarType } from '../../typeCreators';
import { stringType } from './string';
import { booleanType } from './boolean';
import { voidType } from './void';
import { serializableStructureType } from './serializeableStructure';
import { primitiveType } from './primitives';
import { Operator } from '../types';
import { scalarType, integarType, doubleType } from './scalar';
import { listType } from '../collections/list';
import { delegateType } from './delegate';

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

  // ------------------ scalar ---------------------------
  addOperators(
    scalarType,
    [Operator.plus, scalarType],
    [Operator.subtract, scalarType],
    [Operator.multiply, scalarType],
    [Operator.divide, scalarType],
    [Operator.power, scalarType],
    [Operator.greaterThan, booleanType],
    [Operator.lessThan, booleanType],
    [Operator.greaterThanEqual, booleanType],
    [Operator.lessThanEqual, booleanType],
    [Operator.notEqual, booleanType],
    [Operator.equal, booleanType],
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
    [Operator.notEqual, booleanType],
    [Operator.equal, booleanType],
  );
  addPrototype(booleanType, primitiveType);
};
