import { IArgumentType } from './types';
import { createStructureType, createArgSuffixType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './structure';
import { booleanType, stringType } from './primitives';
import { voidType } from './void';

export const terminalInputType: IArgumentType = createStructureType('terminalInput');
addPrototype(terminalInputType, structureType);

addSuffixes(
  terminalInputType,
  createSuffixType('getChar', stringType),
  createSuffixType('hasChar', booleanType),
  createArgSuffixType('clear', voidType),
  createSuffixType('backspace', stringType),
  createSuffixType('return', stringType),
  createSuffixType('enter', stringType),
  createSuffixType('upcursorone', stringType),
  createSuffixType('downcursorone', stringType),
  createSuffixType('leftcursorone', stringType),
  createSuffixType('rightcursorone', stringType),
  createSuffixType('homecursor', stringType),
  createSuffixType('endcursor', stringType),
  createSuffixType('pageupcursor', stringType),
  createSuffixType('pagedowncursor', stringType),
  createSuffixType('deleteright', stringType),
);
