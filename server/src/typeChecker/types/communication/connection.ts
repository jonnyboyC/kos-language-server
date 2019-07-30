import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const connectionType = createStructureType('connection');
connectionType.addSuper(structureType);

connectionType.addSuffixes(
  createSuffixType('isConnected', booleanType),
  createSuffixType('delay', scalarType),
  createArgSuffixType('sendMessage', booleanType, structureType),
  createArgSuffixType('destination', structureType),
);
