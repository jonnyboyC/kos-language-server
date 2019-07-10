import { Type } from './types/types';
import { isSubType } from './typeUitlities';
import { booleanType } from './types/primitives/boolean';
import { stringType } from './types/primitives/string';
import { scalarType } from './types/primitives/scalar';
import { TypeKind } from './types';
import { structureType } from './types/primitives/structure';

/**
 * Attempt to see if type can be coerced into target type
 * @param queryType type in question
 * @param targetType the target of the coercion
 */
export const coerce = (queryType: Type, targetType: Type): boolean => {
  if (targetType === booleanType) {
    return (
      isSubType(queryType, targetType) ||
      isSubType(queryType, stringType) ||
      isSubType(queryType, scalarType)
    );
  }

  // if target type is basic and query is a structure
  // we can assume that structure ~ any so for the type checker
  // it is coercible
  if (targetType.kind === TypeKind.basic && queryType === structureType) {
    return true;
  }

  return isSubType(queryType, targetType);
};
