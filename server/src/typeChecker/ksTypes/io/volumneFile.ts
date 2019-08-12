import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  noMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { volumeItemType } from './volumeItem';
import { fileContentType } from './fileContent';
import { voidType } from '../primitives/void';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';

export const volumeFileType = createStructureType('volumefile');
volumeFileType.addSuper(noMap(volumeItemType));

volumeFileType.addSuffixes(
  noMap(createSuffixType('readall', fileContentType)),
  noMap(createArgSuffixType('write', booleanType, structureType)),
  noMap(createArgSuffixType('writeln', booleanType, stringType)),
  noMap(createArgSuffixType('clear', voidType)),
);
