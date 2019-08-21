import {
  createType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { volumeDirectoryType } from './volumeDirectory';
import { volumeFileType } from './volumneFile';
import { lexiconType } from '../collections/lexicon';
import { scalarType } from '../primitives/scalar';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';

export const volumeType = createType('volume');
volumeType.addSuper(noMap(structureType));

volumeType.addSuffixes(
  noMap(createSuffixType('freespace', scalarType)),
  noMap(createSuffixType('capacity', scalarType)),
  noMap(createSetSuffixType('name', stringType)),
  noMap(createSuffixType('renameable', booleanType)),
  noMap(createSuffixType('powerrequirement', scalarType)),
  noMap(createSuffixType('root', volumeDirectoryType)),
  noMap(createArgSuffixType('exists', booleanType, stringType)),
  noMap(createSuffixType('files', lexiconType)),
  noMap(createArgSuffixType('create', stringType, volumeFileType)),
  noMap(createArgSuffixType('createDir', stringType, volumeDirectoryType)),
  noMap(createArgSuffixType('open', stringType, structureType)),
  noMap(createArgSuffixType('delete', stringType, booleanType)),
);
