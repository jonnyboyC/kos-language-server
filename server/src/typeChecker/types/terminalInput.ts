import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
} from '../typeCreators';
import { structureType } from './primitives/structure';
import { voidType } from './primitives/void';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';

export const terminalInputType = createStructureType('terminalInput');
terminalInputType.addSuper(structureType);

terminalInputType.addSuffixes(
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
