import { IArgumentType } from './types';
import {
  createStructureType, createArgSuffixType,
  createSuffixType, createSetSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { structureType } from './primitives/structure';
import { directionType } from './direction';
import { vectorType } from './collections/vector';
import { listType } from './collections/list';
import { vesselTargetType } from './orbital/vesselTarget';
import { voidType } from './primitives/void';
import { userListType } from './collections/userList';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';
import { booleanType } from './primitives/boolean';

export const partType: IArgumentType = createStructureType('part');
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
  createSuffixType('resources', userListType),
  createSuffixType('targetable', booleanType),
  createSuffixType('ship', vesselTargetType),
  createArgSuffixType('hasModule', booleanType, stringType),
  createArgSuffixType('getModule', /* TODO */ scalarType, stringType),
  createArgSuffixType('getModulesByIndex', /* TODO */ scalarType, scalarType),
  createSuffixType('modules', userListType),
  createSuffixType('allModules', userListType),
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
