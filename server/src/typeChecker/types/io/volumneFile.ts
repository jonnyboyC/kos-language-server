import { ArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { volumeItemType } from './volumeItem';
import { fileContentType } from './fileContent';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';

export const volumeFileType: ArgumentType = createStructureType('volumefile');
addPrototype(volumeFileType, volumeItemType);

addSuffixes(
  volumeFileType,
  createSuffixType('readall', fileContentType),
  createArgSuffixType('write', booleanType, structureType),
  createArgSuffixType('writeln', booleanType, stringType),
  createArgSuffixType('clear', voidType),
);
