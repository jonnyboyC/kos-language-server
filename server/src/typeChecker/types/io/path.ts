import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
  createVarSuffixType,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { volumeType } from './volume';
import { integerType } from '../primitives/scalar';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { serializableStructureType } from '../primitives/serializeableStructure';
import { listType } from '../collections/list';
import { OperatorKind } from '../../types';
import { Operator } from '../../operator';

export const pathType = createStructureType('path');
pathType.addSuper(serializableStructureType);

pathType.addSuffixes(
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

pathType.addOperators(
  new Operator(OperatorKind.equal, booleanType, pathType),
  new Operator(OperatorKind.notEqual, booleanType, pathType),
);
