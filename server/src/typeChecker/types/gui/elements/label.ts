import { createStructureType, createSetSuffixType } from "../../../typeCreators";
import { ArgumentType } from '../../types';
import { addPrototype, addSuffixes } from '../../../typeUitlities';
import { widgetType } from '../widget';

import { userDelegateType } from '../../userDelegate';
import { stringType } from '../../primitives/string';

export const labelType: ArgumentType = createStructureType('label');
addPrototype(labelType, widgetType);

addSuffixes(
  labelType,
  createSetSuffixType('text', stringType),
  createSetSuffixType('image', stringType),
  createSetSuffixType('textUpdater', userDelegateType),
  createSetSuffixType('tooltip', stringType),
);
