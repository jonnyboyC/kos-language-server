import {
  createStructureType,
  createSetSuffixType,
} from '../../../typeCreators';
import { widgetType } from '../widget';

import { userDelegateType } from '../../userDelegate';
import { stringType } from '../../primitives/string';

export const labelType = createStructureType('label');
labelType.addSuper(widgetType);

labelType.addSuffixes(
  createSetSuffixType('text', stringType),
  createSetSuffixType('image', stringType),
  createSetSuffixType('textUpdater', userDelegateType),
  createSetSuffixType('tooltip', stringType),
);
