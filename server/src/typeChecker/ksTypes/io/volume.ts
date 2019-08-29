import {
  createType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../../utilities/typeCreators';
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
  noMap(createSuffixType('freeSpace', scalarType)),
  noMap(createSuffixType('capacity', scalarType)),
  noMap(createSetSuffixType('name', stringType)),
  noMap(createSuffixType('renameable', booleanType)),
  noMap(createSuffixType('powerRequirement', scalarType)),
  noMap(createSuffixType('root', volumeDirectoryType)),
  noMap(createArgSuffixType('exists', booleanType, stringType)),
  noMap(createSuffixType('files', lexiconType)),
  noMap(createArgSuffixType('create', volumeFileType, stringType)),
  noMap(createArgSuffixType('createDir', volumeDirectoryType, stringType)),
  noMap(createArgSuffixType('open', structureType, stringType)),
  noMap(createArgSuffixType('delete', booleanType, stringType)),
);
