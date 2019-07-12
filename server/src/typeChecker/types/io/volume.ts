import { ArgumentType } from '../types';
import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
} from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { structureType } from '../primitives/structure';
import { volumeDirectoryType } from './volumeDirectory';
import { volumeFileType } from './volumneFile';
import { lexiconType } from '../collections/lexicon';
import { scalarType } from '../primitives/scalar';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';

export const volumeType: ArgumentType = createStructureType('volume');
addPrototype(volumeType, structureType);

addSuffixes(
  volumeType,
  createSuffixType('freespace', scalarType),
  createSuffixType('capacity', scalarType),
  createSetSuffixType('name', stringType),
  createSuffixType('renameable', booleanType),
  createSuffixType('powerrequirement', scalarType),
  createSuffixType('root', volumeDirectoryType),
  createArgSuffixType('exists', booleanType, stringType),
  createSuffixType('files', lexiconType),
  createArgSuffixType('create', stringType, volumeFileType),
  createArgSuffixType('createDir', stringType, volumeDirectoryType),
  createArgSuffixType('open', stringType, structureType),
  createArgSuffixType('delete', stringType, booleanType),
);
