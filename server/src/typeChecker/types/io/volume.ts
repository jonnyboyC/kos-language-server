import { IArgumentType } from '../types';
import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
} from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from '../primitives/structure';
import { booleanType, scalarType, stringType } from '../primitives/primitives';
import { volumeDirectoryType } from './volumeDirectory';
import { volumeFileType } from './volumneFile';
import { lexiconType } from '../collections/lexicon';

export const volumeType: IArgumentType = createStructureType('volume');
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
