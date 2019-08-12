import { createStructureType, createSetSuffixType, noMap } from '../typeCreators';
import { structureType } from './primitives/structure';
import { vectorType } from './collections/vector';
import { userDelegateType } from './userDelegate';
import { rgbaType } from './rgba';
import { booleanType } from './primitives/boolean';
import { scalarType } from './primitives/scalar';
import { stringType } from './primitives/string';

export const vectorRendererType = createStructureType('vecDraw');
vectorRendererType.addSuper(noMap(structureType));

vectorRendererType.addSuffixes(
  noMap(createSetSuffixType('vec', vectorType)),
  noMap(createSetSuffixType('vector', vectorType)),
  noMap(createSetSuffixType('vecUpdater', userDelegateType)),
  noMap(createSetSuffixType('vectorUpdater', userDelegateType)),
  noMap(createSetSuffixType('color', rgbaType)),
  noMap(createSetSuffixType('colour', rgbaType)),
  noMap(createSetSuffixType('colorUpdater', userDelegateType)),
  noMap(createSetSuffixType('colourUpdater', userDelegateType)),
  noMap(createSetSuffixType('show', booleanType)),
  noMap(createSetSuffixType('start', vectorType)),
  noMap(createSetSuffixType('startUpdater', userDelegateType)),
  noMap(createSetSuffixType('scale', scalarType)),
  noMap(createSetSuffixType('label', stringType)),
  noMap(createSetSuffixType('width', scalarType)),
  noMap(createSetSuffixType('pointy', booleanType)),
  noMap(createSetSuffixType('wiping', booleanType)),
);
