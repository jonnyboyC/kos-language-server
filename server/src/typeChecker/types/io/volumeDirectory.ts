import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { volumeItemType } from './volumeItem';
import { enumeratorType } from '../collections/enumerator';
import { lexiconType } from '../collections/lexicon';

export const volumeDirectoryType: IArgumentType = createStructureType('volumeDirectory');
addPrototype(volumeDirectoryType, volumeItemType);

addSuffixes(
  volumeDirectoryType,
  createArgSuffixType('iterator', enumeratorType.toConcreteType(volumeItemType)),
  createSuffixType('list', lexiconType),
);
