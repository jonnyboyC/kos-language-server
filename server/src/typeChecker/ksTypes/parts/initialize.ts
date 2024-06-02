import { partType } from './part';
import { structureType } from '../primitives/structure';
import {
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
  createUnion,
} from '../../utilities/typeCreators';
import { noneType } from '../primitives/none';
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
import { Operator } from '../../models/types/operator';
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
    noMap(createArgSuffixType('controlFrom', noneType)),
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
    noMap(createArgSuffixType('getModuleByIndex', partModuleType, scalarType)),
    noMap(createSuffixType('modules', listType.apply(stringType))),
    noMap(createSuffixType('allModules', listType.apply(stringType))),
    noMap(createSuffixType('parent', createUnion(false, partType, stringType))),
    noMap(
      createSuffixType('decoupler', createUnion(false, partType, stringType)),
    ),
    noMap(
      createSuffixType('separator', createUnion(false, partType, stringType)),
    ),
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
    noMap(createArgSuffixType('setField', noneType, structureType, stringType)),
    noMap(createArgSuffixType('doEvent', noneType, stringType)),
    noMap(createArgSuffixType('doAction', noneType, stringType, booleanType)),
  );

  // -------------------- scienceExperimentModule ---------------------------

  scienceExperimentType.addSuper(noMap(partModuleType));

  scienceExperimentType.addSuffixes(
    noMap(createArgSuffixType('deploy', noneType)),
    noMap(createArgSuffixType('reset', noneType)),
    noMap(createArgSuffixType('transmit', noneType)),
    noMap(createArgSuffixType('dump', noneType)),
    noMap(createSuffixType('inoperable', booleanType)),
    noMap(createSuffixType('deployed', booleanType)),
    noMap(createSuffixType('reRunnable', booleanType)),
    noMap(createSuffixType('hasData', booleanType)),
    noMap(createSuffixType('data', listType.apply(scienceDataType))),
  );
};
