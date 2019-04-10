import { IArgumentType } from './types';
import { createStructureType, createArgSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { kosProcessorFields } from './kosProcessorFields';
import { volumeType } from './io/volume';
import { processorConnectionType } from './communication/processorConnection';
import { voidType } from './primitives/void';
import { stringType } from './primitives/string';

export const coreType: IArgumentType = createStructureType('core');
addPrototype(coreType, kosProcessorFields);

addSuffixes(
  coreType,
  createArgSuffixType('mode', stringType),
  createArgSuffixType('activate', voidType),
  createArgSuffixType('deactivate', voidType),
  createArgSuffixType('volume', volumeType),
  createSetSuffixType('tag', stringType),
  createSetSuffixType('bootFilename', stringType),
  createArgSuffixType('connection', processorConnectionType),
);
