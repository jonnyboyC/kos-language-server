import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { volumeItemType } from './volumeItem';
import { lexiconType } from '../collections/lexicon';
import { enumeratorType } from '../collections/enumerator';

export const volumeDirectoryType: IArgumentType = createStructureType('volumeDirectory');
addPrototype(volumeDirectoryType, volumeItemType);

addSuffixes(
  volumeDirectoryType,
  createArgSuffixType('iterator', enumeratorType.toConcreteType(volumeItemType)),
  createSuffixType('list', lexiconType),
);
