import {
  createType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { uniqueSetType } from './collections/uniqueset';
import { delegateType } from './primitives/delegate';
import { loadDistanceType } from './loadDistance';
import { craftTemplateType } from './craftTemplate';
import { timeWarpType } from './timewarp';
import { noneType } from './primitives/none';
import { booleanType } from './primitives/boolean';
import { stringType } from './primitives/string';
import { scalarType } from './primitives/scalar';
import { vesselTargetType } from './orbital/vesselTarget';
import { listType } from './collections/list';

export const kUniverseType = createType('kuniverse');
kUniverseType.addSuper(noMap(structureType));

kUniverseType.addSuffixes(
  noMap(createSuffixType('canRevert', booleanType)),
  noMap(createSuffixType('canRevertToLaunch', booleanType)),
  noMap(createSuffixType('canRevertToEditor', booleanType)),
  noMap(createArgSuffixType('revertToLuanch', noneType)),
  noMap(createArgSuffixType('revertToEditor', noneType)),
  noMap(createSuffixType('canQuickSave', booleanType)),
  noMap(createArgSuffixType('pause', noneType)),
  noMap(createArgSuffixType('quickSave', noneType)),
  noMap(createArgSuffixType('quickLoad', noneType)),
  noMap(createArgSuffixType('quickSaveTo', noneType, stringType)),
  noMap(createArgSuffixType('quickLoadFrom', noneType, stringType)),
  noMap(createSuffixType('quickSaveList', listType.apply(stringType))),
  noMap(createSuffixType('originEditor', stringType)),
  noMap(createSuffixType('defaultLoadDistance', loadDistanceType)),
  noMap(createSetSuffixType('activeVessel', vesselTargetType)),
  noMap(
    createArgSuffixType('forceSetActiveVessel', noneType, vesselTargetType),
  ),
  noMap(createArgSuffixType('forceActive', noneType, vesselTargetType)),
  noMap(createArgSuffixType('hoursPerDay', scalarType)),
  noMap(createArgSuffixType('debugLog', stringType)),
  noMap(
    createArgSuffixType('getCraft', craftTemplateType, stringType, stringType),
  ),
  noMap(createArgSuffixType('launchCraft', noneType, craftTemplateType)),
  noMap(
    createArgSuffixType(
      'launchCraftFrom',
      noneType,
      craftTemplateType,
      stringType,
    ),
  ),
  noMap(createSuffixType('craftList', listType.apply(craftTemplateType))),
  noMap(
    createArgSuffixType(
      'switchVesselWatchers',
      uniqueSetType.apply(delegateType),
    ),
  ),
  noMap(createSuffixType('timewarp', timeWarpType)),
  noMap(createSuffixType('realWorldTime', scalarType)),
  noMap(createSuffixType('realTime', scalarType)),
);
