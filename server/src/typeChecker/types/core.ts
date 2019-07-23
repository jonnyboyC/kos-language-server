import { ArgumentType } from './types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUtilities';
import { kosProcessorFields } from './kosProcessorFields';
import { volumeType } from './io/volume';
import { versionInfoType } from './versionInfo';
import { vesselTargetType } from './orbital/vesselTarget';
import { elementType } from './parts/element';
import { messageQueueType } from './communication/messageQueue';

export const coreType: ArgumentType = createStructureType('core');
addPrototype(coreType, kosProcessorFields);

addSuffixes(
  coreType,
  createSuffixType('version', versionInfoType),
  createSuffixType('vessel', vesselTargetType),
  createSuffixType('element', elementType),
  createSuffixType('currentVolume', volumeType),
  createArgSuffixType('messages', messageQueueType),
);
