import { TypeKind } from '../../types';
import { Type } from '../../types/type';

export const noneType = new Type(
  'none',
  { get: false, set: false },
  new Map(),
  TypeKind.basic,
  undefined,
  undefined,
  false,
);
