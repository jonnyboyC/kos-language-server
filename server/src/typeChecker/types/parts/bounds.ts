import { ArgumentType } from '../types';
import {
  createStructureType,
  createSetSuffixType,
  createArgSuffixType,
} from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/scalar';
import { vectorType } from '../collections/vector';
import { directionType } from '../direction';

export const boundsType: ArgumentType = createStructureType('bounds');
addPrototype(boundsType, structureType);

addSuffixes(
  boundsType,
  createSetSuffixType('absOrigin', vectorType),
  createSetSuffixType('facing', directionType),
  createSetSuffixType('relMin', vectorType),
  createSetSuffixType('relMax', vectorType),
  createArgSuffixType('absMin', vectorType),
  createArgSuffixType('absMax', vectorType),
  createArgSuffixType('relCenter', vectorType),
  createArgSuffixType('absCenter', vectorType),
  createSetSuffixType('extents', vectorType),
  createSetSuffixType('size', vectorType),
  createArgSuffixType('furthestCorner', vectorType, vectorType),
  createArgSuffixType('bottomAlt', scalarType),
  createArgSuffixType('bottomAltRadar', scalarType),
);
