import { createVarType } from '../../utilities/typeCreators';
import { Type } from '../../types/type';
import { TypeKind } from '../../types';
import { CallSignature } from '../../types/callSignature';
import { structureType } from './structure';

export const delegateType = new Type(
  'delegate',
  { get: true, set: true },
  new Map(),
  TypeKind.basic,
  new CallSignature([createVarType(structureType)], structureType),
);
