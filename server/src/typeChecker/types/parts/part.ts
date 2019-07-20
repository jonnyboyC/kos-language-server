import { ArgumentType } from '../types';
import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
} from '../../typeCreators';
import { addPrototype, addSuffixes, addOperators } from '../../typeUtilities';
import { structureType } from '../primitives/structure';
import { directionType } from '../direction';
import { vectorType } from '../collections/vector';
import { listType } from '../collections/list';
import { voidType } from '../primitives/void';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { partModuleType } from './partModule';
import { vesselTargetType } from '../orbital/vesselTarget';
import { resourceType } from './resource';
import { OperatorKind } from '../../types';

export const partType: ArgumentType = createStructureType('part');
addPrototype(partType, structureType);

addSuffixes(
  partType,
  createArgSuffixType('controlFrom', voidType),
  createSuffixType('name', stringType),
  createSuffixType('fuelCrossFeed', booleanType),
  createSuffixType('title', stringType),
  createSuffixType('stage', scalarType),
  createSuffixType('uid', stringType),
  createSuffixType('rotation', directionType),
  createSuffixType('position', vectorType),
  createSetSuffixType('tag', stringType),
  createSuffixType('facing', directionType),
  createSuffixType('resources', listType.toConcreteType(resourceType)),
  createSuffixType('targetable', booleanType),
  createSuffixType('ship', vesselTargetType),
  createArgSuffixType('hasModule', booleanType, stringType),
  createArgSuffixType('getModule', partModuleType, stringType),
  createArgSuffixType('getModulesByIndex', partModuleType, scalarType),
  createSuffixType('modules', listType.toConcreteType(stringType)),
  createSuffixType('allModules', listType.toConcreteType(stringType)),
  createSuffixType('parent', structureType),
  createSuffixType('decoupler', structureType),
  createSuffixType('separator', structureType),
  createSuffixType('decoupledIn', scalarType),
  createSuffixType('separatedIn', scalarType),
  createSuffixType('hasParent', booleanType),
  createSuffixType('children', listType.toConcreteType(partType)),
  createSuffixType('dryMass', scalarType),
  createSuffixType('mass', scalarType),
  createSuffixType('wetMass', scalarType),
  createSuffixType('hasPhysics', booleanType),
);

addOperators(
  partType,
  {
    operator: OperatorKind.equal,
    other: partType,
    returnType: booleanType,
  },
  {
    operator: OperatorKind.notEqual,
    other: partType,
    returnType: booleanType,
  },
);
