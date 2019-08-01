import { partType } from './part';
import { structureType } from '../primitives/structure';
import {
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
} from '../../typeCreators';
import { voidType } from '../primitives/void';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { directionType } from '../direction';
import { vectorType } from '../collections/vector';
import { listType } from '../collections/list';
import { resourceType } from './resource';
import { vesselTargetType } from '../orbital/vesselTarget';
import { partModuleType } from './partModule';
import { OperatorKind } from '../../types';
import { boundsType } from './bounds';
import { Operator } from '../../operator';

let set = false;

export const partInitializer = () => {
  if (set) {
    return;
  }
  set = true;

  // -------------------- part ---------------------------

  partType.addSuper(structureType);

  partType.addSuffixes(
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
    createSuffixType('bounds', boundsType),
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

  partType.addOperators(
    new Operator(OperatorKind.equal, booleanType, partType),
    new Operator(OperatorKind.notEqual, booleanType, partType),
  );

  // -------------------- partmodule ---------------------------

  partModuleType.addSuper(structureType);

  partModuleType.addSuffixes(
    createSuffixType('name', stringType),
    createSuffixType('part', partType),
    createSuffixType('allFields', listType.toConcreteType(stringType)),
    createSuffixType('allFieldNames', listType.toConcreteType(stringType)),
    createSuffixType('hasField', booleanType),
    createSuffixType('allEvents', listType.toConcreteType(stringType)),
    createSuffixType('allEventNames', listType.toConcreteType(stringType)),
    createArgSuffixType('hasEvent', booleanType, stringType),
    createSuffixType('allActions', listType.toConcreteType(stringType)),
    createSuffixType('allActionNames', listType.toConcreteType(stringType)),
    createArgSuffixType('hasAction', booleanType, stringType),
    createArgSuffixType('getField', structureType, stringType),
    createArgSuffixType('setField', voidType, structureType, stringType),
    createArgSuffixType('doEvent', voidType, stringType),
    createArgSuffixType('doAction', voidType, stringType, booleanType),
  );
};
