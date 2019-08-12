import {
  createStructureType,
  createArgSuffixType,
  noMap,
} from '../typeCreators';
import { partModuleType } from './parts/partModule';
import { volumeType } from './io/volume';
import { processorConnectionType } from './communication/processorConnection';
import { voidType } from './primitives/void';
import { stringType } from './primitives/string';

export const kosProcessorFieldsType = createStructureType('kosProcessorFields');
kosProcessorFieldsType.addSuper(noMap(partModuleType));

kosProcessorFieldsType.addSuffixes(
  noMap(createArgSuffixType('mode', stringType)),
  noMap(createArgSuffixType('activate', voidType)),
  noMap(createArgSuffixType('deactivate', voidType)),
  noMap(createArgSuffixType('volume', volumeType)),
  noMap(createArgSuffixType('tag', stringType)),
  noMap(createArgSuffixType('bootFilename', stringType)),
  noMap(createArgSuffixType('connection', processorConnectionType)),
);
