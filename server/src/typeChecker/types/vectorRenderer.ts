import { createStructureType, createSetSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { userDelegateType } from './userDelegate';
import { rgbaType } from './rgba';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';

export const vectorRendererType = createStructureType('vecDraw');
vectorRendererType.addSuper(structureType);

vectorRendererType.addSuffixes(
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
  createSetSuffixType('pointy', booleanType),
  createSetSuffixType('wiping', booleanType),
);
