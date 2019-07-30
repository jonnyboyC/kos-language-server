import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
} from '../../typeCreators';
import { volumeItemType } from './volumeItem';
import { lexiconType } from '../collections/lexicon';
import { enumeratorType } from '../collections/enumerator';

export const volumeDirectoryType = createStructureType('volumeDirectory');
volumeDirectoryType.addSuper(volumeItemType);

volumeDirectoryType.addSuffixes(
  createArgSuffixType(
    'iterator',
    enumeratorType.toConcreteType(volumeItemType),
  ),
  createSuffixType('list', lexiconType),
);
