import {
  createArgSuffixType,
  createParametricType,
  noMap,
  mapTypes,
  createParametricArgSuffixType,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const enumeratorType = createParametricType('enumerator', ['T']);
enumeratorType.addSuper(noMap(structureType));

const valueSuffix = createParametricArgSuffixType('value', ['T'], 'T');

enumeratorType.addSuffixes(
  noMap(createArgSuffixType('next', booleanType)),
  noMap(createArgSuffixType('atEnd', booleanType)),
  noMap(createArgSuffixType('index', scalarType)),
  mapTypes(enumeratorType, valueSuffix),
);
