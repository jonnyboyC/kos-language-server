import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
} from '../typeCreators';
import { kosProcessorFieldsType } from './kosProcessorFields';
import { volumeType } from './io/volume';
import { versionInfoType } from './versionInfo';
import { vesselTargetType } from './orbital/vesselTarget';
import { elementType } from './parts/element';
import { messageQueueType } from './communication/messageQueue';

export const coreType = createStructureType('core');
coreType.addSuper(kosProcessorFieldsType);

coreType.addSuffixes(
  createSuffixType('version', versionInfoType),
  createSuffixType('vessel', vesselTargetType),
  createSuffixType('element', elementType),
  createSuffixType('currentVolume', volumeType),
  createArgSuffixType('messages', messageQueueType),
);
