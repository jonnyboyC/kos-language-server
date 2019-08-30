import {
  createType,
  createArgSuffixType,
  createSuffixType,
  noMap,
} from '../../utilities/typeCreators';
import { volumeItemType } from './volumeItem';
import { lexiconType } from '../collections/lexicon';
import { enumeratorType } from '../collections/enumerator';
import { iterator } from '../../../utilities/constants';

export const volumeDirectoryType = createType('volumeDirectory');
volumeDirectoryType.addSuper(noMap(volumeItemType));

volumeDirectoryType.addSuffixes(
  noMap(createArgSuffixType(iterator, enumeratorType.apply(volumeItemType))),
  noMap(createSuffixType('list', lexiconType)),
);
