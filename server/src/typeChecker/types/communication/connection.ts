import { IType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../structure';
import { booleanType, scalarType } from '../primitives';

export const connectionType: IType = createStructureType('connection');
addPrototype(connectionType, structureType);

addSuffixes(
  connectionType,
  createSuffixType('isConnected', booleanType),
  createSuffixType('delay', scalarType),
  createArgSuffixType('sendMessage', booleanType, structureType),
  createArgSuffixType('destination', structureType),
);
