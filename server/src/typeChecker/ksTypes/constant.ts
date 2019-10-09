import { createType, createSuffixType, noMap } from '../utilities/typeCreators';
import { structureType } from './primitives/structure';
import { doubleType } from './primitives/scalar';
import { TypeKind } from '../types';
import { ConstantType } from '../models/types/constantType';

export const gType = new ConstantType(
  'g',
  6.67384e-11,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
gType.addSuper(noMap(doubleType));

export const eType = new ConstantType(
  'e',
  Math.E,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
eType.addSuper(noMap(doubleType));

export const piType = new ConstantType(
  'pi',
  Math.PI,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
piType.addSuper(noMap(doubleType));

export const cType = new ConstantType(
  'c',
  299792458.0,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
cType.addSuper(noMap(doubleType));

export const atmToKpaType = new ConstantType(
  'atmtokpa',
  101.325,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
atmToKpaType.addSuper(noMap(doubleType));

export const kpaToAtmType = new ConstantType(
  'kpatoatm',
  0.00986923266716012830002467308167,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
kpaToAtmType.addSuper(noMap(doubleType));

export const degToRadType = new ConstantType(
  'degtorad',
  0.01745329251994329576923690768489,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
degToRadType.addSuper(noMap(doubleType));

export const radToDegType = new ConstantType(
  'radtodeg',
  57.295779513082320876798154814105,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
radToDegType.addSuper(noMap(doubleType));

export const avogadroType = new ConstantType(
  'avogadro',
  6.02214076e23,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
avogadroType.addSuper(noMap(structureType));

export const boltzmannType = new ConstantType(
  'boltzmann',
  1.380649e-23,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
boltzmannType.addSuper(noMap(structureType));

export const idealGasType = new ConstantType(
  'idealGas',
  8.31446215324,
  { get: true, set: false },
  new Map(),
  TypeKind.basic,
);
idealGasType.addSuper(noMap(structureType));

export const constantType = createType('constant');
constantType.addSuper(noMap(structureType));

constantType.addSuffixes(
  noMap(createSuffixType(gType.name, gType)),
  noMap(createSuffixType(eType.name, eType)),
  noMap(createSuffixType(piType.name, piType)),
  noMap(createSuffixType(cType.name, cType)),
  noMap(createSuffixType(atmToKpaType.name, atmToKpaType)),
  noMap(createSuffixType(kpaToAtmType.name, kpaToAtmType)),
  noMap(createSuffixType(degToRadType.name, degToRadType)),
  noMap(createSuffixType(radToDegType.name, radToDegType)),
);
