import { IType } from './types';
import { createStructureType, createArgSuffixType, createVarSuffixType } from './ksType';
import { addPrototype, addSuffixes, createVarType } from './typeUitlities';
import { structureType } from './structure';
import { booleanType } from './primitives';

export const delegateType: IType = createStructureType('delegate');
addPrototype(delegateType, structureType);

addSuffixes(
  delegateType,
  createVarSuffixType('call', structureType, createVarType(structureType)),
  createVarSuffixType('bind', delegateType, createVarType(structureType)),
  createArgSuffixType('isdead', booleanType),
);
