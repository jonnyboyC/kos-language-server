import {
  createType,
  createArgSuffixType,
  createSuffixType,
  noMap,
} from '../typeCreators';
import { kosProcessorFieldsType } from './kosProcessorFields';
import { volumeType } from './io/volume';
import { versionInfoType } from './versionInfo';
import { vesselTargetType } from './orbital/vesselTarget';
import { elementType } from './parts/element';
import { messageQueueType } from './communication/messageQueue';

export const coreType = createType('core');
coreType.addSuper(noMap(kosProcessorFieldsType));

coreType.addSuffixes(
  noMap(createSuffixType('version', versionInfoType)),
  noMap(createSuffixType('vessel', vesselTargetType)),
  noMap(createSuffixType('element', elementType)),
  noMap(createSuffixType('currentVolume', volumeType)),
  noMap(createArgSuffixType('messages', messageQueueType)),
);
