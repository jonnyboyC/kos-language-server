import { IType, ISuffixMap, IVarType } from './types';

class Type implements IType {
  public suffixes: ISuffixMap;
  public inherentsFrom?: IType;
  constructor(
    public readonly name: string,
    public readonly params?: IType[] | IVarType,
    public readonly returns?: IType) {
    this.suffixes = {};
  }

  get tag(): 'type' {
    return 'type';
  }
}

export const createStructureType = (name: string): IType => {
  return new Type(name);
};

export const createSuffixType = (name: string, returns?: IType, ...params: IType[]): IType => {
  return new Type(name, params, returns);
};

export const createVarSuffixType = (name: string, returns?: IType, params?: IVarType): IType => {
  return new Type(name, params, returns);
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

export const functionType: IType = createStructureType('function');
export const structureType: IType = createStructureType('structure');
export const stringType: IType = createStructureType('string');
export const scalarType: IType = createStructureType('scalar');
export const booleanType: IType = createStructureType('boolean');
export const delegateType: IType = createStructureType('delegate');

addPrototype(stringType, structureType);
addPrototype(scalarType, structureType);
addPrototype(booleanType, structureType);
addPrototype(delegateType, structureType);

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

addSuffixs(
  delegateType,
  createSuffixType('call', structureType),
  createSuffixType('bind', delegateType),
  createSuffixType('isdead', booleanType),
);
