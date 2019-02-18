import { IType } from './types/types';
import { isSubType } from './typeUitlities';

export const coerce = (type: IType, target: IType): boolean => {
  return isSubType(type, target);
};
