import { Type } from '../../ksType';
import { TypeKind } from '../../types';

export const structureType = new Type(
  'structure',
  { get: true, set: true },
  [],
  new Map(),
  TypeKind.basic,
  undefined,
  undefined,
  true,
);
