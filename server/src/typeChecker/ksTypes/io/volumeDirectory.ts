import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  noMap,
} from '../../typeCreators';
import { volumeItemType } from './volumeItem';
import { lexiconType } from '../collections/lexicon';
import { enumeratorType } from '../collections/enumerator';

export const volumeDirectoryType = createStructureType('volumeDirectory');
volumeDirectoryType.addSuper(noMap(volumeItemType));

volumeDirectoryType.addSuffixes(
  noMap(
    createArgSuffixType('iterator', enumeratorType.toConcrete(volumeItemType)),
  ),
  noMap(createSuffixType('list', lexiconType)),
);
