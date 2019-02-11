import { IArgumentType } from './types';
import {
  createStructureType, createArgSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { stringType } from './primitives';
import { voidType } from './void';
import { partModuleFields } from './partModuleFields';
import { volumeType } from './io/volume';
import { processorConnectionType } from './communication/processorConnection';

export const kosProcessorFields: IArgumentType = createStructureType('kosProcessorFields');
addPrototype(kosProcessorFields, partModuleFields);

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
