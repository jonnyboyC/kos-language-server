import { IArgumentType } from './types';
import {
  createStructureType, createArgSuffixType,
} from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { partModuleFieldsType } from './parts/partModuleFields';
import { volumeType } from './io/volume';
import { processorConnectionType } from './communication/processorConnection';
import { voidType } from './primitives/void';
import { stringType } from './primitives/string';

export const kosProcessorFields: IArgumentType = createStructureType('kosProcessorFields');
addPrototype(kosProcessorFields, partModuleFieldsType);

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
