import {
  createType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { uniqueSetType } from './collections/uniqueset';
import { delegateType } from './primitives/delegate';
import { loadDistanceType } from './loadDistance';
import { craftTemplateType } from './craftTemplate';
import { timeWarpType } from './timewarp';
import { voidType } from './primitives/void';
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
  noMap(createArgSuffixType('revertToLuanch', voidType)),
  noMap(createArgSuffixType('revertToEditor', voidType)),
  noMap(createSuffixType('canQuickSave', booleanType)),
  noMap(createArgSuffixType('pause', voidType)),
  noMap(createArgSuffixType('quickSave', voidType)),
  noMap(createArgSuffixType('quickLoad', voidType)),
  noMap(createArgSuffixType('quickSaveTo', voidType, stringType)),
  noMap(createArgSuffixType('quickLoadFrom', voidType, stringType)),
  noMap(createSuffixType('quickSaveList', listType.apply(stringType))),
  noMap(createSuffixType('originEditor', stringType)),
  noMap(createSuffixType('defaultLoadDistance', loadDistanceType)),
  noMap(createSetSuffixType('activeVessel', vesselTargetType)),
  noMap(createArgSuffixType('forceSetActiveVessel', voidType, vesselTargetType)),
  noMap(createArgSuffixType('forceActive', voidType, vesselTargetType)),
  noMap(createArgSuffixType('hoursPerDay', scalarType)),
  noMap(createArgSuffixType('debugLog', stringType)),
  noMap(createArgSuffixType('getCraft', craftTemplateType, stringType, stringType)),
  noMap(createArgSuffixType('launchCraft', voidType, craftTemplateType)),
  noMap(createArgSuffixType(
    'launchCraftFrom',
    voidType,
    craftTemplateType,
    stringType,
  )),
  noMap(createSuffixType('craftList', listType.apply(craftTemplateType))),
  noMap(createArgSuffixType(
    'switchVesselWatchers',
    uniqueSetType.apply(delegateType),
  )),
  noMap(createSuffixType('timewarp', timeWarpType)),
  noMap(createSuffixType('realWorldTime', scalarType)),
  noMap(createSuffixType('realTime', scalarType)),
);
