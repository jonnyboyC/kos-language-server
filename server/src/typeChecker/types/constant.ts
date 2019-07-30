import { ConstantType } from '../ksType';
import { createStructureType, createSuffixType } from '../typeCreators';
import { structureType } from './primitives/structure';
import { doubleType } from './primitives/scalar';
import { TypeKind } from '../types';

export const gType = new ConstantType(
  'g',
  6.67384e-11,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
gType.addSuper(doubleType);

export const eType = new ConstantType(
  'e',
  Math.E,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
eType.addSuper(doubleType);

export const piType = new ConstantType(
  'pi',
  Math.PI,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
piType.addSuper(doubleType);

export const cType = new ConstantType(
  'c',
  299792458.0,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
cType.addSuper(doubleType);

export const atmToKpaType = new ConstantType(
  'atmtokpa',
  101.325,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
atmToKpaType.addSuper(doubleType);

export const kpaToAtmType = new ConstantType(
  'kpatoatm',
  0.00986923266716012830002467308167,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
kpaToAtmType.addSuper(doubleType);

export const degToRadType = new ConstantType(
  'degtorad',
  0.01745329251994329576923690768489,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
degToRadType.addSuper(doubleType);

export const radToDegType = new ConstantType(
  'radtodeg',
  57.295779513082320876798154814105,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
radToDegType.addSuper(doubleType);

export const avogadroType = new ConstantType(
  'avogadro',
  6.02214076e23,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
avogadroType.addSuper(structureType);

export const boltzmannType = new ConstantType(
  'boltzmann',
  1.380649e-23,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
boltzmannType.addSuper(structureType);

export const idealGasType = new ConstantType(
  'idealGas',
  8.31446215324,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
idealGasType.addSuper(structureType);

export const constantType = createStructureType('constant');
constantType.addSuper(structureType);

constantType.addSuffixes(
  createSuffixType(gType.name, gType),
  createSuffixType(eType.name, eType),
  createSuffixType(piType.name, piType),
  createSuffixType(cType.name, cType),
  createSuffixType(atmToKpaType.name, atmToKpaType),
  createSuffixType(kpaToAtmType.name, kpaToAtmType),
  createSuffixType(degToRadType.name, degToRadType),
  createSuffixType(radToDegType.name, radToDegType),
);
