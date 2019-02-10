import { IArgumentType } from './types';
import {
  createStructureType, createArgSuffixType,
  createSuffixType, createSetSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, stringType, scalarType } from './primitives';
import { voidType } from './void';
import { directionType } from './direction';
import { vectorType } from './collections/vector';
import { userListType, listType } from './collections/list';
import { vesselTargetType } from './orbital/vesselTarget';

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
