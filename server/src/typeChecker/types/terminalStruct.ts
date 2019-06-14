import { ArgumentType } from './types';
import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
} from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { uniqueSetType } from './collections/uniqueset';
import { terminalInputType } from './terminalInput';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';
import { userDelegateType } from './userDelegate';

export const terminalStructType: ArgumentType = createStructureType(
  'terminalStruct',
);
addPrototype(terminalStructType, structureType);

addSuffixes(
  terminalStructType,
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
