import { Type } from './types/types';
import { isSubType } from './typeUitlities';
import { booleanType } from './types/primitives/boolean';
import { stringType } from './types/primitives/string';
import { scalarType } from './types/primitives/scalar';

/**
 * Attempt to see if type can be coerced into target type
 * @param type type in question
 * @param target the target of the coercion
 */
export const coerce = (type: Type, target: Type): boolean => {
  if (target === booleanType) {
    return isSubType(type, target)
      || isSubType(type, stringType)
      || isSubType(type, scalarType);
  }

  return isSubType(type, target);
};
