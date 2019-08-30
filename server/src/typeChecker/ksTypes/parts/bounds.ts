import {
  createType,
  createSetSuffixType,
  createArgSuffixType,
  noMap,
} from '../../utilities/typeCreators';
import { structureType } from '../primitives/structure';
import { scalarType } from '../primitives/scalar';
import { vectorType } from '../collections/vector';
import { directionType } from '../collections/direction';

export const boundsType = createType('bounds');
boundsType.addSuper(noMap(structureType));

boundsType.addSuffixes(
  noMap(createSetSuffixType('absOrigin', vectorType)),
  noMap(createSetSuffixType('facing', directionType)),
  noMap(createSetSuffixType('relMin', vectorType)),
  noMap(createSetSuffixType('relMax', vectorType)),
  noMap(createArgSuffixType('absMin', vectorType)),
  noMap(createArgSuffixType('absMax', vectorType)),
  noMap(createArgSuffixType('relCenter', vectorType)),
  noMap(createArgSuffixType('absCenter', vectorType)),
  noMap(createSetSuffixType('extents', vectorType)),
  noMap(createSetSuffixType('size', vectorType)),
  noMap(createArgSuffixType('furthestCorner', vectorType, vectorType)),
  noMap(createArgSuffixType('bottomAlt', scalarType)),
  noMap(createArgSuffixType('bottomAltRadar', scalarType)),
);
