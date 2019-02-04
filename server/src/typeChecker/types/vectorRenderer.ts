import { IArgumentType } from './types';
import { createStructureType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, scalarType, stringType } from './primitives';
import { vectorType } from './collections/vector';
import { userDelegateType } from './userDelegate';
import { rgbaType } from './rgba';

export const vectorRendererType: IArgumentType = createStructureType('vecDraw');
addPrototype(vectorRendererType, structureType);

addSuffixes(
  vectorRendererType,
  createSetSuffixType('vec', vectorType),
  createSetSuffixType('vector', vectorType),
  createSetSuffixType('vecUpdater', userDelegateType),
  createSetSuffixType('vectorUpdater', userDelegateType),
  createSetSuffixType('color', rgbaType),
  createSetSuffixType('colour', rgbaType),
  createSetSuffixType('colorUpdater', userDelegateType),
  createSetSuffixType('colourUpdater', userDelegateType),
  createSetSuffixType('show', booleanType),
  createSetSuffixType('start', vectorType),
  createSetSuffixType('startUpdater', userDelegateType),
  createSetSuffixType('scale', scalarType),
  createSetSuffixType('label', stringType),
  createSetSuffixType('width', scalarType),
);
