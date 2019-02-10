import { IType } from './types/types';
import { isSubType } from './types/typeUitlities';

export const coerce = (type: IType, target: IType): boolean => {
  if (type.tag === 'function' || target.tag === 'function') {
    if (type === target) {
      return true;
    }

    return false;
  }

  return isSubType(type, target);
};
