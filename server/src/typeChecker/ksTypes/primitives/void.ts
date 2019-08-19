import { TypeKind } from '../../types';
import { Type } from '../../types/type';

export const voidType = new Type(
  'void',
  { get: false, set: false },
  new Map(),
  TypeKind.basic,
  undefined,
  undefined,
  false,
);
