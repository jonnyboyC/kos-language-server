import { createStructureType, createSetSuffixType } from '../../ksType';
import { IType } from '../../types';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { widgetType } from '../widget';
import { stringType } from '../../primitives';
import { userDelegateType } from '../../userDelegate';

export const labelType: IType = createStructureType('label');
addPrototype(labelType, widgetType);

addSuffixes(
  labelType,
  createSetSuffixType('text', stringType),
  createSetSuffixType('image', stringType),
  createSetSuffixType('textUpdater', userDelegateType),
  createSetSuffixType('tooltip', stringType),
);
