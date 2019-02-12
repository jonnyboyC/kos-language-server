import { IArgumentType } from './types';
import { createStructureType, createArgSuffixType, createSetSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { stringType } from './primitives';
import { kosProcessorFields } from './kosProcessorFields';
import { voidType } from './void';
import { volumeType } from './io/volume';
import { processorConnectionType } from './communication/processorConnection';

export const coreType: IArgumentType = createStructureType('core');
addPrototype(coreType, kosProcessorFields);

addSuffixes(
  coreType,
  createArgSuffixType('mode', stringType),
  createArgSuffixType('activate', voidType),
  createArgSuffixType('deactivate', voidType),
  createArgSuffixType('volume', volumeType),
  createArgSuffixType('tag', stringType),
  createSetSuffixType('bootFilename', stringType),
  createArgSuffixType('connection', processorConnectionType),
);
