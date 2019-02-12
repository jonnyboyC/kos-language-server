import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../primitives/structure';
import { booleanType, stringType } from '../primitives/primitives';
import { volumeItemType } from './volumeItem';
import { fileContentType } from './fileContent';
import { voidType } from '../primitives/void';

export const volumeFileType: IArgumentType = createStructureType('volumefile');
addPrototype(volumeFileType, volumeItemType);

addSuffixes(
  volumeFileType,
  createSuffixType('readall', fileContentType),
  createArgSuffixType('write', booleanType, structureType),
  createArgSuffixType('writeln', booleanType, stringType),
  createArgSuffixType('clear', voidType),
);
