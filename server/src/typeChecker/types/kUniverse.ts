import { IArgumentType } from './types';
import {
  createStructureType, createArgSuffixType,
  createSuffixType, createSetSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, stringType, scalarType } from './primitives';
import { voidType } from './void';
import { userListType } from './collections/list';
import { vesselTargetType } from './orbital/vesselTarget';
import { uniqueSetType } from './collections/uniqueset';
import { delegateType } from './delegate';
import { loadDistanceType } from './loadDistance';
import { craftTemplateType } from './craftTemplate';
import { timeWarpType } from './timewarp';

export const kUniverseType: IArgumentType = createStructureType('kuniverse');
addPrototype(kUniverseType, structureType);

addSuffixes(
  kUniverseType,
  createSuffixType('canRevert', booleanType),
  createSuffixType('canRevertToLaunch', booleanType),
  createSuffixType('canRevertToEditor', booleanType),
  createArgSuffixType('revertToLuanch', voidType),
  createArgSuffixType('revertToEditor', voidType),
  createSuffixType('canQuickSave', booleanType),
  createArgSuffixType('quickSave', voidType),
  createArgSuffixType('quickLoad', voidType),
  createArgSuffixType('quickSaveTo', voidType, stringType),
  createArgSuffixType('quickLoadFrom', voidType, stringType),
  createSuffixType('quickSaveList', userListType),
  createSuffixType('originEditor', stringType),
  createSuffixType('defaultLoadDistance',  loadDistanceType),
  createSetSuffixType('activeVessel', vesselTargetType),
  createArgSuffixType('forceSetActiveVessel', voidType, vesselTargetType),
  createArgSuffixType('forceActive', voidType, vesselTargetType),
  createArgSuffixType('hoursPerDay', scalarType),
  createArgSuffixType('debugLog', stringType),
  createArgSuffixType('getCraft', craftTemplateType, stringType, stringType),
  createArgSuffixType('launchCraft', voidType, craftTemplateType),
  createArgSuffixType('launchCraftFrom', voidType, craftTemplateType, stringType),
  createSuffixType('craftList', userListType),
  createArgSuffixType('switchVesselWatchers', uniqueSetType.toConcreteType(delegateType)),
  createSuffixType('timewarp', timeWarpType),
  createSuffixType('realWorldTime', scalarType),
  createSuffixType('realTime', scalarType),
);
