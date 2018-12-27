import { IType } from './types';

export const createStructureType = (name: string): IType => {
  return {
    name,
    suffixes: {},
  };
};

export const createSuffixType = (name: string, returns?: IType, ...params: IType[]): IType => {
  return {
    name,
    returns,
    params,
    suffixes: {},
  };
};

const addPrototype = (type: IType, parent: IType): IType => {
  type.inherentsFrom = parent;
  return type;
};

const addSuffixs = (type: IType, ...suffixes: IType[]): void => {
  for (const suffix of suffixes) {
    type.suffixes[suffix.name] = suffix;
  }
};

export const structureType: IType = createStructureType('structure');
export const stringType: IType = createStructureType('string');
export const scalarType: IType = createStructureType('scalar');
export const booleanType: IType = createStructureType('boolean');

addPrototype(stringType, structureType);
addPrototype(scalarType, structureType);
addPrototype(booleanType, structureType);

addSuffixs(
  structureType,
  createSuffixType('tostring', stringType),
  createSuffixType('hassuffix', booleanType, stringType),
  createSuffixType('suffixnames', undefined),
  createSuffixType('isserializable', booleanType),
  createSuffixType('typename', stringType),
  createSuffixType('istype', booleanType, stringType),
  createSuffixType('inheritance', stringType),
);

addSuffixs(
  stringType,
  createSuffixType('length', scalarType),
  createSuffixType('substring', stringType, scalarType, scalarType),
  createSuffixType('contains', booleanType, stringType),
  createSuffixType('endswith', booleanType, stringType),
  createSuffixType('findat', scalarType, stringType, scalarType),
  createSuffixType('insert', stringType, scalarType, stringType),
  createSuffixType('findlastat', scalarType, stringType, scalarType),
  createSuffixType('padleft', stringType, scalarType),
  createSuffixType('padright', stringType, scalarType),
  createSuffixType('remove', stringType, scalarType, scalarType),
  createSuffixType('replace', stringType, stringType, stringType),
  createSuffixType('split', undefined, stringType),
  createSuffixType('startswith', booleanType, stringType),
  createSuffixType('tolower', stringType),
  createSuffixType('toupper', stringType),
  createSuffixType('trim', stringType),
  createSuffixType('trimend', stringType),
  createSuffixType('trimstart', stringType),
  createSuffixType('matchespattern', booleanType, stringType),
  createSuffixType('tonumber', scalarType, structureType),
  createSuffixType('toscalar', scalarType, structureType),
  createSuffixType('format', stringType, structureType),
);
