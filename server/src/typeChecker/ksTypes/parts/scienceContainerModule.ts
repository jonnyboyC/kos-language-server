import {
  createArgSuffixType,
  createSuffixType,
  createType,
  noMap,
} from '../../utilities/typeCreators';
import { userListType } from '../collections/userList';
import { booleanType } from '../primitives/boolean';
import { noneType } from '../primitives/none';
import { integerType } from '../primitives/scalar';
import { partModuleType } from './partModule';

export const scienceContainerModuleType = createType('scienceContainerModule');
scienceContainerModuleType.addSuper(noMap(partModuleType));

scienceContainerModuleType.addSuffixes(
  noMap(createSuffixType('hasData', booleanType)),
  noMap(createSuffixType('data', userListType)),
  noMap(createArgSuffixType('dumpData', noneType, integerType)),
  noMap(createArgSuffixType('collectAll', noneType)),
);
