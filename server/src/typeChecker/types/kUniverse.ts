import { IArgumentType } from './types';
import { createStructureType, createArgSuffixType, createVarSuffixType, createSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes, createVarType } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, stringType, scalarType } from './primitives';
import { voidType } from './void';
import { userListType } from './collections/list';
import { vesselTargetType } from './orbital/vesselTarget';
import { uniqueSetType } from './collections/uniqueset';
import { delegateType } from './delegate';

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
  createSuffixType('defaultLoadDistance',  /* TODO */ structureType),
  createSetSuffixType('activeVessel', vesselTargetType),
  createArgSuffixType('forceSetActiveVessel', voidType, vesselTargetType),
  createArgSuffixType('forceActive', voidType, vesselTargetType),
  createArgSuffixType('hoursPerDay', scalarType),
  createArgSuffixType('debugLog', stringType),
  createArgSuffixType('getCraft', /* TODO */ structureType, stringType, stringType),
  createArgSuffixType('launchCraft', voidType, /* TODO */ structureType),
  createArgSuffixType('launchCraftFrom', voidType, /* TODO */ structureType, stringType),
  createSuffixType('craftList', userListType),
  createArgSuffixType('switchVesselWatchers', uniqueSetType.toConcreteType(delegateType)),
  createSuffixType('timewarp', /* TODO */ structureType),
  createSuffixType('realWorldTime', scalarType),
  createSuffixType('realTime', scalarType),
);
