import { ArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const connectionType: ArgumentType = createStructureType('connection');
addPrototype(connectionType, structureType);

addSuffixes(
  connectionType,
  createSuffixType('isConnected', booleanType),
  createSuffixType('delay', scalarType),
  createArgSuffixType('sendMessage', booleanType, structureType),
  createArgSuffixType('destination', structureType),
);
