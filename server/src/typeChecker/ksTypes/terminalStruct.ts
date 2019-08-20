import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { uniqueSetType } from './collections/uniqueset';
import { terminalInputType } from './terminalInput';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';
import { userDelegateType } from './userDelegate';

export const terminalStructType = createStructureType('terminalStruct');
terminalStructType.addSuper(noMap(structureType));

terminalStructType.addSuffixes(
  noMap(createSetSuffixType('height', scalarType)),
  noMap(createSetSuffixType('width', scalarType)),
  noMap(createSetSuffixType('reverse', booleanType)),
  noMap(createSetSuffixType('visualBeep', booleanType)),
  noMap(createSetSuffixType('brightness', scalarType)),
  noMap(createSetSuffixType('charWidth', scalarType)),
  noMap(createSetSuffixType('charHeight', scalarType)),
  noMap(createArgSuffixType(
    'resizeWatchers',
    uniqueSetType.apply(userDelegateType),
  )),
  noMap(createSuffixType('input', terminalInputType)),
);
