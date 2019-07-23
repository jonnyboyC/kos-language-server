import { ArgumentType } from '../types';
import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
  createVarSuffixType,
  createVarType,
} from '../../typeCreators';
import { addPrototype, addSuffixes, addOperators } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { volumeType } from './volume';
import { integerType } from '../primitives/scalar';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { serializableStructureType } from '../primitives/serializeableStructure';
import { listType } from '../collections/list';
import { OperatorKind } from '../../types';

export const pathType: ArgumentType = createStructureType('path');
addPrototype(pathType, serializableStructureType);

addSuffixes(
  pathType,
  createSuffixType('volume', volumeType),
  createSuffixType('segments', listType.toConcreteType(stringType)),
  createSuffixType('length', integerType),
  createSuffixType('name', stringType),
  createSuffixType('hasExtension', booleanType),
  createSuffixType('extension', stringType),
  createSuffixType('root', pathType),
  createSuffixType('parent', pathType),
  createArgSuffixType('isParent', pathType, booleanType),
  createArgSuffixType('changeName', pathType, stringType),
  createArgSuffixType('changeExtension', pathType, stringType),
  createVarSuffixType('combine', pathType, createVarType(structureType)),
);

addOperators(
  pathType,
  {
    operator: OperatorKind.equal,
    other: pathType,
    returnType: booleanType,
  },
  {
    operator: OperatorKind.notEqual,
    other: pathType,
    returnType: booleanType,
  },
);
