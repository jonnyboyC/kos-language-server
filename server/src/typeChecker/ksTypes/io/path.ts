import {
  createType,
  createSuffixType,
  createArgSuffixType,
  createVarSuffixType,
  createVarType,
  noMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { volumeType } from './volume';
import { integerType } from '../primitives/scalar';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { serializableType } from '../primitives/serializeableStructure';
import { listType } from '../collections/list';
import { OperatorKind } from '../../types';
import { Operator } from '../../types/operator';

export const pathType = createType('path');
pathType.addSuper(noMap(serializableType));

pathType.addSuffixes(
  noMap(createSuffixType('volume', volumeType)),
  noMap(createSuffixType('segments', listType.apply(stringType))),
  noMap(createSuffixType('length', integerType)),
  noMap(createSuffixType('name', stringType)),
  noMap(createSuffixType('hasExtension', booleanType)),
  noMap(createSuffixType('extension', stringType)),
  noMap(createSuffixType('root', pathType)),
  noMap(createSuffixType('parent', pathType)),
  noMap(createArgSuffixType('isParent', booleanType, pathType)),
  noMap(createArgSuffixType('changeName', pathType, stringType)),
  noMap(createArgSuffixType('changeExtension', pathType, stringType)),
  noMap(createVarSuffixType('combine', pathType, createVarType(structureType))),
);

pathType.addOperators(
  new Operator(pathType, OperatorKind.equal, booleanType, pathType),
  new Operator(pathType, OperatorKind.notEqual, booleanType, pathType),
);
