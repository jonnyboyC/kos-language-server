import {
  createType,
  createArgSuffixType,
  createSuffixType,
  noMap,
} from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { noneType } from './primitives/none';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';

export const terminalInputType = createType('terminalInput');
terminalInputType.addSuper(noMap(structureType));

terminalInputType.addSuffixes(
  noMap(createSuffixType('getChar', stringType)),
  noMap(createSuffixType('hasChar', booleanType)),
  noMap(createArgSuffixType('clear', noneType)),
  noMap(createSuffixType('backspace', stringType)),
  noMap(createSuffixType('return', stringType)),
  noMap(createSuffixType('enter', stringType)),
  noMap(createSuffixType('upcursorone', stringType)),
  noMap(createSuffixType('downcursorone', stringType)),
  noMap(createSuffixType('leftcursorone', stringType)),
  noMap(createSuffixType('rightcursorone', stringType)),
  noMap(createSuffixType('homecursor', stringType)),
  noMap(createSuffixType('endcursor', stringType)),
  noMap(createSuffixType('pageupcursor', stringType)),
  noMap(createSuffixType('pagedowncursor', stringType)),
  noMap(createSuffixType('deleteright', stringType)),
);
