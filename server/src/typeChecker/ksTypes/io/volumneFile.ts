import {
  createType,
  createArgSuffixType,
  createSuffixType,
  noMap,
} from '../../utilities/typeCreators';
import { structureType } from '../primitives/structure';
import { volumeItemType } from './volumeItem';
import { fileContentType } from './fileContent';
import { noneType } from '../primitives/none';
import { booleanType } from '../primitives/boolean';
import { stringType } from '../primitives/string';

export const volumeFileType = createType('volumefile');
volumeFileType.addSuper(noMap(volumeItemType));

volumeFileType.addSuffixes(
  noMap(createSuffixType('readAll', fileContentType)),
  noMap(createArgSuffixType('write', booleanType, structureType)),
  noMap(createArgSuffixType('writeln', booleanType, stringType)),
  noMap(createArgSuffixType('clear', noneType)),
);
