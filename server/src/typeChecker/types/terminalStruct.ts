import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { uniqueSetType } from './collections/uniqueset';
import { terminalInputType } from './terminalInput';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';
import { userDelegateType } from './userDelegate';

export const terminalStructType = createStructureType('terminalStruct');
terminalStructType.addSuper(structureType);

terminalStructType.addSuffixes(
  createSetSuffixType('height', scalarType),
  createSetSuffixType('width', scalarType),
  createSetSuffixType('reverse', booleanType),
  createSetSuffixType('visualBeep', booleanType),
  createSetSuffixType('brightness', scalarType),
  createSetSuffixType('charWidth', scalarType),
  createSetSuffixType('charHeight', scalarType),
  createArgSuffixType(
    'resizeWatchers',
    uniqueSetType.toConcreteType(userDelegateType),
  ),
  createSuffixType('input', terminalInputType),
);
