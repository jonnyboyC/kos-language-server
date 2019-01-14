import { IType } from './types';
import {
  createStructureType, createArgSuffixType,
  createSuffixType, createSetSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, scalarType } from './primitives';
import { uniqueSetType } from './collections/uniqueset';
import { terminalInputType } from './terminalInput';

export const terminalStructType: IType = createStructureType('terminalStruct');
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
  createArgSuffixType('resizeWatchers', uniqueSetType.toConcreteType(scalarType)), /* TODO */
  createSuffixType('input', terminalInputType),
);
