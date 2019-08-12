import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  noMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';

export const connectionType = createStructureType('connection');
connectionType.addSuper(noMap(structureType));

connectionType.addSuffixes(
  noMap(createSuffixType('isConnected', booleanType)),
  noMap(createSuffixType('delay', scalarType)),
  noMap(createArgSuffixType('sendMessage', booleanType, structureType)),
  noMap(createArgSuffixType('destination', structureType)),
);
