import {
  createType,
  createSetSuffixType,
  noMap,
} from '../../../typeCreators';
import { widgetType } from '../widget';

import { userDelegateType } from '../../userDelegate';
import { stringType } from '../../primitives/string';

export const labelType = createType('label');
labelType.addSuper(noMap(widgetType));

labelType.addSuffixes(
  noMap(createSetSuffixType('text', stringType)),
  noMap(createSetSuffixType('image', stringType)),
  noMap(createSetSuffixType('textUpdater', userDelegateType)),
  noMap(createSetSuffixType('tooltip', stringType)),
);
