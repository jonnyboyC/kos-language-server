import { IType } from './types/types';
import { isSubType } from './typeUitlities';

/**
 * Attempt to see if type can be coerced into target type
 * @param type type in question
 * @param target the target of the coercion
 */
export const coerce = (type: IType, target: IType): boolean => {
  return isSubType(type, target);
};
