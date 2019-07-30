import { createStructureType, createArgSuffixType } from '../typeCreators';
import { partModuleType } from './parts/partModule';
import { volumeType } from './io/volume';
import { processorConnectionType } from './communication/processorConnection';
import { voidType } from './primitives/void';
import { stringType } from './primitives/string';

export const kosProcessorFieldsType = createStructureType('kosProcessorFields');
kosProcessorFieldsType.addSuper(partModuleType);

kosProcessorFieldsType.addSuffixes(
  createArgSuffixType('mode', stringType),
  createArgSuffixType('activate', voidType),
  createArgSuffixType('deactivate', voidType),
  createArgSuffixType('volume', volumeType),
  createArgSuffixType('tag', stringType),
  createArgSuffixType('bootFilename', stringType),
  createArgSuffixType('connection', processorConnectionType),
);
