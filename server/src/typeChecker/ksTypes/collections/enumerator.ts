import {
  createArgSuffixType,
  createGenericStructureType,
  noMap,
  mapTypes,
  createGenericArgSuffixType,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const enumeratorType = createGenericStructureType('enumerator', ['T']);
enumeratorType.addSuper(noMap(structureType));

const valueSuffix = createGenericArgSuffixType('value', ['T'], 'T');

enumeratorType.addSuffixes(
  noMap(createArgSuffixType('next', booleanType)),
  noMap(createArgSuffixType('atend', booleanType)),
  noMap(createArgSuffixType('index', scalarType)),
  mapTypes(enumeratorType, valueSuffix),
);
