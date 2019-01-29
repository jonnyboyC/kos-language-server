import { IType } from './types/types';
import { isSubType } from './types/typeUitlities';

export const coerce = (type: IType, target: IType): boolean => {
  return isSubType(type, target);
};
