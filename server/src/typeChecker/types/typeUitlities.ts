import { IType, IVarType, IGenericType, IGenericVarType, ISuffixMap } from './types';
import { empty } from '../../utilities/typeGuards';
import { memoize } from '../../utilities/memoize';

// check to see type is a sub type of target type
export const isSubType = (targetType: IType, type: IType): boolean => {
  return moveDownPrototype(type, false, (currentType) => {
    if (currentType.core === targetType.core) {
      return true;
    }

    return undefined;
  });
};

export const hasSuffix = (type: IType, suffix: string): boolean => {
  return moveDownPrototype(type, false, (currentType) => {
    if (!empty(currentType.suffixes.get(suffix))) {
      return true;
    }

    return undefined;
  });
};

export const allSuffixes = (type: IType): IType[] => {
  const suffixes: ISuffixMap = new Map();

  moveDownPrototype(type, false, (currentType) => {
    for (const [name, suffix] of currentType.suffixes) {
      if (!suffixes.has(name)) {
        suffixes.set(name, suffix);
      }
    }

    return undefined;
  });

  return Array.from(suffixes.values());
};

const moveDownPrototype = <T>(
  type: IType,
  nullValue: T,
  func: (currentType: IType) => Maybe<T>): T => {

  let currentType = type;
  while (true) {
    const result = func(currentType);
    if (!empty(result)) {
      return result;
    }

    if (empty(currentType.inherentsFrom)) {
      return nullValue;
    }
    currentType = currentType.inherentsFrom;
  }
};

export const isFullVarType = (type: IGenericVarType): type is IVarType => {
  return isFullType(type.type);
};
export const isFullType = (type: IGenericType): type is IType => {
  const { tag } = type as IType;
  return !empty(tag) && tag === 'type';
};

export const createVarType = memoize((type: IType): IVarType => {
  return {
    type,
    tag: 'varType',
  };
});

// add prototype to type
export const addPrototype = <T extends IGenericType>(type: T, parent: T): void => {
  type.inherentsFrom = parent;
};

export const addSuffixes = <T extends IGenericType>(type: T, ...suffixes: T[]): void => {
  for (const suffix of suffixes) {
    if (type.suffixes.has(suffix.name)) {
      throw new Error('duplicate suffix added to type');
    }

    type.suffixes.set(suffix.name, suffix);
  }
};
