import {
  createStructureType,
  createSetSuffixType,
  createArgSuffixType,
} from '../../typeCreators';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/scalar';
import { vectorType } from '../collections/vector';
import { directionType } from '../direction';

export const boundsType = createStructureType('bounds');
boundsType.addSuper(structureType);

boundsType.addSuffixes(
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
