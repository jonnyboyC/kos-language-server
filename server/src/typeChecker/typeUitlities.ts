import { empty } from '../utilities/typeGuards';
import { memoize } from '../utilities/memoize';
import {
  IArgumentType,
  IGenericArgumentType,
  IGenericVariadicType,
  IGenericSuffixType,
  ISuffixType,
  IVariadicType,
  IGenericBasicType,
  Operator,
  IType,
  IBasicType,
  CallType,
} from './types/types';
import { VariadicType } from './types/ksType';

export const isCorrectCallType = (callType: CallType, targetCallType: CallType): boolean => {
  switch (callType) {
    case CallType.optionalCall:
      return targetCallType === CallType.get
        || targetCallType === CallType.call
        || targetCallType === CallType.optionalCall;
    case CallType.get:
    case CallType.set:
    case CallType.call:
      return targetCallType === callType;
  }
};

// check to see type is a sub type of target type
export const isSubType = (type: IType, targetType: IType): boolean => {
  if (type.tag === 'type' && targetType.tag === 'type') {
    return moveDownPrototype(type, false, (currentType) => {
      if (currentType === targetType) {
        return true;
      }

      return undefined;
    });
  }

  return type === targetType;
};

export const hasOperator = (type: IType, operator: Operator): Maybe<IArgumentType> => {
  if (type.tag === 'type') {
    return moveDownPrototype(type, undefined, (currentType) => {
      if (!empty(currentType.operators.has(operator))) {
        return type;
      }

      return undefined;
    });
  }

  return undefined;
};

export const hasSuffix = (type: IArgumentType, suffix: string): boolean => {
  return moveDownPrototype(type, false, (currentType) => {
    if (currentType.suffixes.has(suffix)) {
      return true;
    }

    return undefined;
  });
};

export const getSuffix = (type: IArgumentType, suffix: string): Maybe<ISuffixType> => {
  return moveDownPrototype(type, undefined, (currentType) => {
    return currentType.suffixes.get(suffix);
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
  return type.fullType;
};

export const createVarType = memoize((type: IArgumentType): IVariadicType => {
  return new VariadicType(type);
});

// add prototype to type
export const addPrototype = <T extends IGenericBasicType>(type: T, parent: T): void => {
  type.inherentsFrom = parent;
};

export const addOperators = <T extends IGenericBasicType>(
  type: T,
  ...operators: [Operator, IBasicType][]): void => {

  for (const [operator, returnType] of operators) {
    if (type.operators.has(operator)) {
      throw new Error(`duplicate operator ${operator} added to type`);
    }

    type.operators.set(operator, returnType);
  }
};

export const addSuffixes = <T extends IGenericBasicType, S extends IGenericSuffixType>(
  type: T, ...suffixes: S[]): void => {
  for (const suffix of suffixes) {
    if (type.suffixes.has(suffix.name)) {
      throw new Error(`duplicate suffix ${suffix.name} added to type`);
    }

    type.suffixes.set(suffix.name, suffix);
  }
};
