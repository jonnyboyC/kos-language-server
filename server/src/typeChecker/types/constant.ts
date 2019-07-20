import { ArgumentType, IBasicType } from './types';
import { ConstantType } from '../ksType';
import { createStructureType, createSuffixType } from '../typeCreators';
import { addPrototype, addSuffixes } from '../typeUtilities';
import { structureType } from './primitives/structure';
import { doubleType } from './primitives/scalar';

export const gType = new ConstantType('g', 6.67384e-11);
addPrototype<IBasicType>(gType, doubleType);

export const eType = new ConstantType('e', Math.E);
addPrototype<IBasicType>(eType, doubleType);

export const piType = new ConstantType('pi', Math.PI);
addPrototype<IBasicType>(piType, doubleType);

export const cType = new ConstantType('c', 299792458.0);
addPrototype<IBasicType>(cType, doubleType);

export const atmToKpaType = new ConstantType('atmtokpa', 101.325);
addPrototype<IBasicType>(atmToKpaType, doubleType);

export const kpaToAtmType = new ConstantType(
  'kpatoatm',
  0.00986923266716012830002467308167,
);
addPrototype<IBasicType>(kpaToAtmType, doubleType);

export const degToRadType = new ConstantType(
  'degtorad',
  0.01745329251994329576923690768489,
);
addPrototype<IBasicType>(degToRadType, doubleType);

export const radToDegType = new ConstantType(
  'radtodeg',
  57.295779513082320876798154814105,
);
addPrototype<IBasicType>(radToDegType, doubleType);

export const constantType: ArgumentType = createStructureType('constant');
addPrototype<IBasicType>(constantType, structureType);

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
