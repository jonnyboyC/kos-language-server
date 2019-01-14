import { IType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../structure';
import { booleanType, stringType } from '../primitives';
import { volumeItemType } from './volumeItem';
import { voidType } from '../void';
import { fileContentType } from './fileContent';

export const volumeFileType: IType = createStructureType('volumefile');
addPrototype(volumeFileType, volumeItemType);

addSuffixes(
  volumeFileType,
  createSuffixType('readall', fileContentType),
  createArgSuffixType('write', booleanType, structureType),
  createArgSuffixType('writeln', booleanType, stringType),
  createArgSuffixType('clear', voidType),
);
