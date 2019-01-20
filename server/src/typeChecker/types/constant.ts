import { IConstantType, IType } from './types';
import { ConstantType, TypeCoreConstant, createStructureType } from './ksType';
import { addPrototype, addSuffixes } from './typeUitlities';
import { doubleType } from './primitives';
import { structureType } from './structure';

export const gType: IConstantType<number>
  = new ConstantType(new TypeCoreConstant('g', false, false, 6.67384e-11));
addPrototype(gType, doubleType);

export const eType: IConstantType<number>
  = new ConstantType(new TypeCoreConstant('e', false, false, Math.E));
addPrototype(eType, doubleType);

export const piType: IConstantType<number>
  = new ConstantType(new TypeCoreConstant('pi', false, false, Math.PI));
addPrototype(piType, doubleType);

export const cType: IConstantType<number>
  = new ConstantType(new TypeCoreConstant('c', false, false, 299792458.0));
addPrototype(cType, doubleType);

export const atmToKpaType: IConstantType<number>
  = new ConstantType(new TypeCoreConstant('atmtokpa', false, false, 101.325));
addPrototype(atmToKpaType, doubleType);

export const kpaToAtmType: IConstantType<number>
  = new ConstantType(new TypeCoreConstant(
    'kpatoatm', false, false, 0.00986923266716012830002467308167));
addPrototype(kpaToAtmType, doubleType);

export const degToRadType: IConstantType<number>
  = new ConstantType(new TypeCoreConstant(
    'degtorad', false, false, 0.01745329251994329576923690768489));
addPrototype(degToRadType, doubleType);

export const radToDegType: IConstantType<number>
  = new ConstantType(new TypeCoreConstant(
    'radtodeg', false, false, 57.295779513082320876798154814105));
addPrototype(radToDegType, doubleType);

export const constantType: IType = createStructureType('constant');
addPrototype(constantType, structureType);

addSuffixes(
  constantType,
  gType,
  eType,
  piType,
  cType,
  atmToKpaType,
  kpaToAtmType,
  degToRadType,
  radToDegType,
);
