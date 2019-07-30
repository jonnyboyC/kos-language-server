import {
  createArgSuffixType,
  createGenericStructureType,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const enumeratorType = createGenericStructureType('enumerator');
enumeratorType.addSuper(structureType);
const typeParameters = enumeratorType.getTypeParameters();

enumeratorType.addSuffixes(
  createArgSuffixType('next', booleanType),
  createArgSuffixType('atend', booleanType),
  createArgSuffixType('index', scalarType),
  createGenericArgSuffixType('value', typeParameters[0].placeHolder),
);
