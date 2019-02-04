import { empty } from '../../utilities/typeGuards';
import { memoize } from '../../utilities/memoize';
import {
  IArgumentType,
  IGenericArgumentType,
  IGenericVariadicType,
  IGenericSuffixType,
  ISuffixType,
  IVariadicType,
  IGenericBasicType,
} from './types';
import { VariadicType } from './ksType';

// check to see type is a sub type of target type
export const isSubType = (type: IArgumentType, targetType: IArgumentType): boolean => {
  return moveDownPrototype(type, false, (currentType) => {
    if (currentType === targetType) {
      return true;
    }

    return undefined;
  });
};

export const hasSuffix = (type: IArgumentType, suffix: string): boolean => {
  return moveDownPrototype(type, false, (currentType) => {
    if (!empty(currentType.suffixes.get(suffix))) {
      return true;
    }

    return undefined;
  });
};

export const allSuffixes = (type: IArgumentType): ISuffixType[] => {
  const suffixes: Map<string, ISuffixType> = new Map();

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
  type: IArgumentType,
  nullValue: T,
  func: (currentType: IArgumentType) => Maybe<T>): T => {

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

export const isFullVarType = (type: IGenericVariadicType):type is IVariadicType => {
  return isFullType(type.type);
};

export const isFullType = (type: IGenericArgumentType): type is IArgumentType => {
  const check = type as IArgumentType;
  return !empty(check.fullType) && check.fullType;
};

export const createVarType = memoize((type: IArgumentType): IVariadicType => {
  return new VariadicType(type);
});

// add prototype to type
export const addPrototype = <T extends IGenericBasicType>(type: T, parent: T): void => {
  type.inherentsFrom = parent;
};

export const addSuffixes = <T extends IGenericBasicType, S extends IGenericSuffixType>(
  type: T, ...suffixes: S[]): void => {
  for (const suffix of suffixes) {
    if (type.suffixes.has(suffix.name)) {
      throw new Error('duplicate suffix added to type');
    }

    type.suffixes.set(suffix.name, suffix);
  }
};
