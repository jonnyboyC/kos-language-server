import { createStructureType, createSetSuffixType } from '../../ksType';
import { IArgumentType } from '../../types';
import { addPrototype, addSuffixes } from '../../../typeUitlities';
import { widgetType } from '../widget';

import { userDelegateType } from '../../userDelegate';
import { stringType } from '../../primitives/string';

export const labelType: IArgumentType = createStructureType('label');
addPrototype(labelType, widgetType);

addSuffixes(
  labelType,
  createSetSuffixType('text', stringType),
  createSetSuffixType('image', stringType),
  createSetSuffixType('textUpdater', userDelegateType),
  createSetSuffixType('tooltip', stringType),
);
