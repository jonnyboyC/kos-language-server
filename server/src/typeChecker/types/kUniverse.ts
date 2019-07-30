import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
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

export const kUniverseType = createStructureType('kuniverse');
kUniverseType.addSuper(structureType);

kUniverseType.addSuffixes(
  createSuffixType('canRevert', booleanType),
  createSuffixType('canRevertToLaunch', booleanType),
  createSuffixType('canRevertToEditor', booleanType),
  createArgSuffixType('revertToLuanch', voidType),
  createArgSuffixType('revertToEditor', voidType),
  createSuffixType('canQuickSave', booleanType),
  createArgSuffixType('pause', voidType),
  createArgSuffixType('quickSave', voidType),
  createArgSuffixType('quickLoad', voidType),
  createArgSuffixType('quickSaveTo', voidType, stringType),
  createArgSuffixType('quickLoadFrom', voidType, stringType),
  createSuffixType('quickSaveList', listType.toConcreteType(stringType)),
  createSuffixType('originEditor', stringType),
  createSuffixType('defaultLoadDistance', loadDistanceType),
  createSetSuffixType('activeVessel', vesselTargetType),
  createArgSuffixType('forceSetActiveVessel', voidType, vesselTargetType),
  createArgSuffixType('forceActive', voidType, vesselTargetType),
  createArgSuffixType('hoursPerDay', scalarType),
  createArgSuffixType('debugLog', stringType),
  createArgSuffixType('getCraft', craftTemplateType, stringType, stringType),
  createArgSuffixType('launchCraft', voidType, craftTemplateType),
  createArgSuffixType(
    'launchCraftFrom',
    voidType,
    craftTemplateType,
    stringType,
  ),
  createSuffixType('craftList', listType.toConcreteType(craftTemplateType)),
  createArgSuffixType(
    'switchVesselWatchers',
    uniqueSetType.toConcreteType(delegateType),
  ),
  createSuffixType('timewarp', timeWarpType),
  createSuffixType('realWorldTime', scalarType),
  createSuffixType('realTime', scalarType),
);
