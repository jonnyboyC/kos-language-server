import { TypeKind } from '../../types';
import { Type } from '../../models/types/type';

export const structureType = new Type(
  'structure',
  { get: true, set: true },
  new Map(),
  TypeKind.basic,
  undefined,
  undefined,
  true,
);
