import {
  createArgSuffixType,
  createGenericStructureType,
  createGenericArgSuffixType,
  noMap,
  passThroughMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const enumeratorType = createGenericStructureType('enumerator');
enumeratorType.addSuper(noMap(structureType));
const typeParameters = enumeratorType.getTypeParameters();

enumeratorType.addSuffixes(
  noMap(createArgSuffixType('next', booleanType)),
  noMap(createArgSuffixType('atend', booleanType)),
  noMap(createArgSuffixType('index', scalarType)),
  passThroughMap(
    enumeratorType,
    createGenericArgSuffixType('value', typeParameters[0].placeHolder),
  ),
);
