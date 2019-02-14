import { IArgumentType } from './types';
import { ConstantType, createStructureType, createSuffixType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { structureType } from './primitives/structure';
import { doubleType } from './primitives/scalar';

export const gType = new ConstantType('g', 6.67384e-11);
addPrototype(gType, doubleType);

export const eType = new ConstantType('e', Math.E);
addPrototype(eType, doubleType);

export const piType = new ConstantType('pi', Math.PI);
addPrototype(piType, doubleType);

export const cType = new ConstantType('c', 299792458.0);
addPrototype(cType, doubleType);

export const atmToKpaType = new ConstantType('atmtokpa', 101.325);
addPrototype(atmToKpaType, doubleType);

export const kpaToAtmType = new ConstantType('kpatoatm', 0.00986923266716012830002467308167);
addPrototype(kpaToAtmType, doubleType);

export const degToRadType = new ConstantType('degtorad', 0.01745329251994329576923690768489);
addPrototype(degToRadType, doubleType);

export const radToDegType = new ConstantType('radtodeg', 57.295779513082320876798154814105);
addPrototype(radToDegType, doubleType);

export const constantType: IArgumentType = createStructureType('constant');
addPrototype(constantType, structureType);

addSuffixes(
  constantType,
  createSuffixType(gType.name, gType),
  createSuffixType(eType.name, eType),
  createSuffixType(piType.name, piType),
  createSuffixType(cType.name, cType),
  createSuffixType(atmToKpaType.name, atmToKpaType),
  createSuffixType(kpaToAtmType.name, kpaToAtmType),
  createSuffixType(degToRadType.name, degToRadType),
  createSuffixType(radToDegType.name, radToDegType),
);
