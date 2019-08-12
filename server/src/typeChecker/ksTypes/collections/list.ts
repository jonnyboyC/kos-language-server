import {
  createArgSuffixType,
  createGenericStructureType,
  createGenericArgSuffixType,
  noMap,
  passThroughMap,
} from '../../typeCreators';
import { voidType } from '../primitives/void';
import { scalarType } from '../primitives/scalar';
import { collectionType } from './enumerable';
import { stringType } from '../primitives/string';

export const listType = createGenericStructureType('list');
listType.addSuper(passThroughMap(collectionType, listType));

const [tType] = listType.getTypeParameters();

listType.addSuffixes(
  passThroughMap(listType, createGenericArgSuffixType('copy', listType)),
  passThroughMap(
    listType,
    createGenericArgSuffixType('add', voidType, tType.placeHolder),
  ),
  passThroughMap(
    listType,
    createGenericArgSuffixType(
      'insert',
      voidType,
      scalarType,
      tType.placeHolder,
    ),
  ),
  noMap(createArgSuffixType('remove', voidType, scalarType)),
  passThroughMap(
    listType,
    createGenericArgSuffixType('sublist', listType, scalarType, scalarType),
  ),
  noMap(createArgSuffixType('join', stringType, stringType)),
  passThroughMap(
    listType,
    createGenericArgSuffixType('indexOf', scalarType, tType.placeHolder),
  ),
  passThroughMap(
    listType,
    createGenericArgSuffixType('find', scalarType, tType.placeHolder),
  ),
  passThroughMap(
    listType,
    createGenericArgSuffixType('lastIndexOf', scalarType, tType.placeHolder),
  ),
  passThroughMap(
    listType,
    createGenericArgSuffixType('findLast', scalarType, tType.placeHolder),
  ),
);
