import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { volumeItemType } from './volumeItem';
import { fileContentType } from './fileContent';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';

export const volumeFileType: IArgumentType = createStructureType('volumefile');
addPrototype(volumeFileType, volumeItemType);

addSuffixes(
  volumeFileType,
  createSuffixType('readall', fileContentType),
  createArgSuffixType('write', booleanType, structureType),
  createArgSuffixType('writeln', booleanType, stringType),
  createArgSuffixType('clear', voidType),
);
