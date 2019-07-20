import { ArgumentType } from './types';
import { createStructureType, createArgSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUtilities';
import { partModuleType } from './parts/partModule';
import { volumeType } from './io/volume';
import { processorConnectionType } from './communication/processorConnection';
import { voidType } from './primitives/void';
import { stringType } from './primitives/string';

export const kosProcessorFields: ArgumentType = createStructureType('kosProcessorFields');
addPrototype(kosProcessorFields, partModuleType);

addSuffixes(
  kosProcessorFields,
  createArgSuffixType('mode', stringType),
  createArgSuffixType('activate', voidType),
  createArgSuffixType('deactivate', voidType),
  createArgSuffixType('volume', volumeType),
  createArgSuffixType('tag', stringType),
  createArgSuffixType('bootFilename', stringType),
  createArgSuffixType('connection', processorConnectionType),
);
