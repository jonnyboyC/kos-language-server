import {
  createType,
  createArgSuffixType,
  createSuffixType,
  noMap,
} from '../../typeCreators';
import { volumeItemType } from './volumeItem';
import { lexiconType } from '../collections/lexicon';
import { enumeratorType } from '../collections/enumerator';

export const volumeDirectoryType = createType('volumeDirectory');
volumeDirectoryType.addSuper(noMap(volumeItemType));

volumeDirectoryType.addSuffixes(
  noMap(
    createArgSuffixType('iterator', enumeratorType.apply(volumeItemType)),
  ),
  noMap(createSuffixType('list', lexiconType)),
);
