import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const connectionType: IArgumentType = createStructureType('connection');
addPrototype(connectionType, structureType);

addSuffixes(
  connectionType,
  createSuffixType('isConnected', booleanType),
  createSuffixType('delay', scalarType),
  createArgSuffixType('sendMessage', booleanType, structureType),
  createArgSuffixType('destination', structureType),
);
