import {
  createArgSuffixType,
  createGenericStructureType,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { voidType } from '../primitives/void';
import { scalarType } from '../primitives/scalar';
import { collectionType } from './enumerable';
import { stringType } from '../primitives/string';
import { passThroughTypeParameter } from '../../typeUtilities';

export const listType = createGenericStructureType('list');
listType.addSuper(
  collectionType,
  passThroughTypeParameter(listType, collectionType),
);

const [tType] = listType.getTypeParameters();

listType.addSuffixes(
  createGenericArgSuffixType('copy', listType),
  createGenericArgSuffixType('add', voidType, tType.placeHolder),
  createGenericArgSuffixType('insert', voidType, scalarType, tType.placeHolder),
  createArgSuffixType('remove', voidType, scalarType),
  createGenericArgSuffixType('sublist', listType, scalarType, scalarType),
  createArgSuffixType('join', stringType, stringType),
  createGenericArgSuffixType('indexOf', scalarType, tType.placeHolder),
  createGenericArgSuffixType('find', scalarType, tType.placeHolder),
  createGenericArgSuffixType('lastIndexOf', scalarType, tType.placeHolder),
  createGenericArgSuffixType('findLast', scalarType, tType.placeHolder),
);
