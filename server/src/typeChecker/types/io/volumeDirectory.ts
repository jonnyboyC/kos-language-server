import { ArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from "../../typeCreators";
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { volumeItemType } from './volumeItem';
import { lexiconType } from '../collections/lexicon';
import { enumeratorType } from '../collections/enumerator';

export const volumeDirectoryType: ArgumentType = createStructureType('volumeDirectory');
addPrototype(volumeDirectoryType, volumeItemType);

addSuffixes(
  volumeDirectoryType,
  createArgSuffixType('iterator', enumeratorType.toConcreteType(volumeItemType)),
  createSuffixType('list', lexiconType),
);
