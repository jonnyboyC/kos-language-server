import { createType, createArgSuffixType, noMap } from '../utilities/typeCreators';
import { partModuleType } from './parts/partModule';
import { volumeType } from './io/volume';
import { processorConnectionType } from './communication/processorConnection';
import { noneType } from './primitives/none';
import { stringType } from './primitives/string';

export const kosProcessorFieldsType = createType('kosProcessorFields');
kosProcessorFieldsType.addSuper(noMap(partModuleType));

kosProcessorFieldsType.addSuffixes(
  noMap(createArgSuffixType('mode', stringType)),
  noMap(createArgSuffixType('activate', noneType)),
  noMap(createArgSuffixType('deactivate', noneType)),
  noMap(createArgSuffixType('volume', volumeType)),
  noMap(createArgSuffixType('tag', stringType)),
  noMap(createArgSuffixType('bootFilename', stringType)),
  noMap(createArgSuffixType('connection', processorConnectionType)),
);
