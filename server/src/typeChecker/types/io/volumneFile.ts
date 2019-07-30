import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { volumeItemType } from './volumeItem';
import { fileContentType } from './fileContent';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';

export const volumeFileType = createStructureType('volumefile');
volumeFileType.addSuper(volumeItemType);

volumeFileType.addSuffixes(
  createSuffixType('readall', fileContentType),
  createArgSuffixType('write', booleanType, structureType),
  createArgSuffixType('writeln', booleanType, stringType),
  createArgSuffixType('clear', voidType),
);
