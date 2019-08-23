import { partType } from './part';
import { structureType } from '../primitives/structure';
import {
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../../typeCreators';
import { voidType } from '../primitives/void';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { scalarType } from '../primitives/scalar';
import { directionType } from '../collections/direction';
import { vectorType } from '../collections/vector';
import { listType } from '../collections/list';
import { resourceType } from './resource';
import { vesselTargetType } from '../orbital/vesselTarget';
import { partModuleType } from './partModule';
import { OperatorKind } from '../../types';
import { boundsType } from './bounds';
import { Operator } from '../../types/operator';
import { scienceExperimentType } from './scienceExperimentModule';
import { scienceDataType } from '../scienceData';

let set = false;

export const partInitializer = () => {
  if (set) {
    return;
  }
  set = true;

  // -------------------- part ---------------------------

  partType.addSuper(noMap(structureType));

  partType.addSuffixes(
    noMap(createArgSuffixType('controlFrom', voidType)),
    noMap(createSuffixType('name', stringType)),
    noMap(createSuffixType('fuelCrossFeed', booleanType)),
    noMap(createSuffixType('title', stringType)),
    noMap(createSuffixType('stage', scalarType)),
    noMap(createSuffixType('cid', stringType)),
    noMap(createSuffixType('uid', stringType)),
    noMap(createSuffixType('rotation', directionType)),
    noMap(createSuffixType('position', vectorType)),
    noMap(createSetSuffixType('tag', stringType)),
    noMap(createSuffixType('facing', directionType)),
    noMap(createSuffixType('bounds', boundsType)),
    noMap(createSuffixType('resources', listType.apply(resourceType))),
    noMap(createSuffixType('targetable', booleanType)),
    noMap(createSuffixType('ship', vesselTargetType)),
    noMap(createArgSuffixType('hasModule', booleanType, stringType)),
    noMap(createArgSuffixType('getModule', partModuleType, stringType)),
    noMap(createArgSuffixType('getModulesByIndex', partModuleType, scalarType)),
    noMap(createSuffixType('modules', listType.apply(stringType))),
    noMap(createSuffixType('allModules', listType.apply(stringType))),
    noMap(createSuffixType('parent', structureType)), // TODO part | string
    noMap(createSuffixType('decoupler', structureType)), // TODO part | string
    noMap(createSuffixType('separator', structureType)), // TODO part | string
    noMap(createSuffixType('decoupledIn', scalarType)),
    noMap(createSuffixType('separatedIn', scalarType)),
    noMap(createSuffixType('hasParent', booleanType)),
    noMap(createSuffixType('children', listType.apply(partType))),
    noMap(createSuffixType('dryMass', scalarType)),
    noMap(createSuffixType('mass', scalarType)),
    noMap(createSuffixType('wetMass', scalarType)),
    noMap(createSuffixType('hasPhysics', booleanType)),
  );

  partType.addOperators(
    new Operator(partType, OperatorKind.equal, booleanType, partType),
    new Operator(partType, OperatorKind.notEqual, booleanType, partType),
  );

  // -------------------- partmodule ---------------------------

  partModuleType.addSuper(noMap(structureType));

  partModuleType.addSuffixes(
    noMap(createSuffixType('name', stringType)),
    noMap(createSuffixType('part', partType)),
    noMap(createSuffixType('allFields', listType.apply(stringType))),
    noMap(createSuffixType('allFieldNames', listType.apply(stringType))),
    noMap(createArgSuffixType('hasField', booleanType, stringType)),
    noMap(createSuffixType('allEvents', listType.apply(stringType))),
    noMap(createSuffixType('allEventNames', listType.apply(stringType))),
    noMap(createArgSuffixType('hasEvent', booleanType, stringType)),
    noMap(createSuffixType('allActions', listType.apply(stringType))),
    noMap(createSuffixType('allActionNames', listType.apply(stringType))),
    noMap(createArgSuffixType('hasAction', booleanType, stringType)),
    noMap(createArgSuffixType('getField', structureType, stringType)),
    noMap(createArgSuffixType('setField', voidType, structureType, stringType)),
    noMap(createArgSuffixType('doEvent', voidType, stringType)),
    noMap(createArgSuffixType('doAction', voidType, stringType, booleanType)),
  );

  // -------------------- scienceExperimentModule ---------------------------

  scienceExperimentType.addSuper(noMap(partModuleType));

  scienceExperimentType.addSuffixes(
    noMap(createArgSuffixType('deploy', voidType)),
    noMap(createArgSuffixType('reset', voidType)),
    noMap(createArgSuffixType('transmit', voidType)),
    noMap(createArgSuffixType('dump', voidType)),
    noMap(createSuffixType('inoperable', booleanType)),
    noMap(createSuffixType('deployed', booleanType)),
    noMap(createSuffixType('reRunnable', booleanType)),
    noMap(createSuffixType('hasData', booleanType)),
    noMap(createSuffixType('data', listType.apply(scienceDataType))),
  );
};
