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
  Type,
  IBasicType,
  CallType,
  TypeKind,
} from './types/types';
import { VariadicType } from './types/ksType';

/**
 * check if the target call type is compatable with real call type
 * @param queryCallType real call type
 * @param targetCallType query call type
 */
export const isCorrectCallType = (
  queryCallType: CallType,
  targetCallType: CallType,
): boolean => {
  switch (queryCallType) {
    case CallType.optionalCall:
      return (
        targetCallType === CallType.get ||
        targetCallType === CallType.call ||
        targetCallType === CallType.optionalCall
      );
    case CallType.get:
    case CallType.set:
    case CallType.call:
      return targetCallType === queryCallType;
  }
};

/**
 * check to see type is a sub type of target type
 * @param queryType query type
 * @param targetType target type
 */
export const isSubType = (queryType: Type, targetType: Type): boolean => {
  if (queryType.kind === TypeKind.basic && targetType.kind === TypeKind.basic) {
    return moveDownPrototype(queryType, false, currentType => {
      if (currentType === targetType) {
        return true;
      }

      return undefined;
    });
  }

  return queryType === targetType;
};

/**
 * Does the given type have the requested operator
 * @param type type
 * @param operator operator
 */
export const hasOperator = (
  type: Type,
  operator: Operator,
): Maybe<IArgumentType> => {
  if (type.kind === TypeKind.basic) {
    return moveDownPrototype(type, undefined, currentType => {
      if (!empty(currentType.operators.has(operator))) {
        return type;
      }

      return undefined;
    });
  }

  return undefined;
};

/**
 * Does the given type have the requested suffix
 * @param type type
 * @param suffix suffix string
 */
export const hasSuffix = (type: Type, suffix: string): boolean => {
  if (type.kind === TypeKind.basic) {
    return moveDownPrototype(type, false, currentType => {
      if (currentType.suffixes.has(suffix)) {
        return true;
      }

      return undefined;
    });
  }

  return false;
};

/**
 * Get the provided suffix from the type if it exists
 * @param type type
 * @param suffix suffix string
 */
export const getSuffix = (type: Type, suffix: string): Maybe<ISuffixType> => {
  if (type.kind === TypeKind.basic) {
    return moveDownPrototype(type, undefined, currentType => {
      return currentType.suffixes.get(suffix);
    });
  }

  return undefined;
};

/**
 * Retreive all suffixes from the given type
 * @param type type
 */
export const allSuffixes = (type: Type): ISuffixType[] => {
  if (type.kind === TypeKind.basic) {
    const suffixes: Map<string, ISuffixType> = new Map();

    moveDownPrototype(type, false, currentType => {
      for (const [name, suffix] of currentType.suffixes) {
        if (!suffixes.has(name)) {
          suffixes.set(name, suffix);
        }
      }

      return undefined;
    });

    return Array.from(suffixes.values());
  }

  return [];
};

/**
 * Is the generic variadic type a full variadic type
 * @param type maybe full variadic type
 */
export const isFullVarType = (
  type: IGenericVariadicType,
): type is IVariadicType => {
  return isFullType(type.type);
};

/**
 * Is the generic arguemnt type a full argument type
 * @param type maybe full argument type
 */
export const isFullType = (
  type: IGenericArgumentType,
): type is IArgumentType => {
  return type.fullType;
};

/**
 * Create variadic type
 */
export const createVarType = memoize(
  (type: IArgumentType): IVariadicType => {
    return new VariadicType(type);
  },
);

/**
 * Add type to prototype chain
 * @param type type to add prototype
 * @param prototype prototype
 */
export const addPrototype = <T extends IGenericBasicType>(
  type: T,
  prototype: T,
): void => {
  type.inherentsFrom = prototype;
};

/**
 * Add operator to type
 * @param type type to add operator
 * @param operators operators
 */
export const addOperators = <T extends IGenericBasicType>(
  type: T,
  ...operators: [Operator, IBasicType][]
): void => {
  for (const [operator, returnType] of operators) {
    if (type.operators.has(operator)) {
      throw new Error(`duplicate operator ${operator} added to type`);
    }

    type.operators.set(operator, returnType);
  }
};

/**
 * Add suffixes to type
 * @param type type to add suffixes
 * @param suffixes suffixes
 */
export const addSuffixes = <
  T extends IGenericBasicType,
  S extends IGenericSuffixType
>(
  type: T,
  ...suffixes: S[]
): void => {
  for (const suffix of suffixes) {
    if (type.suffixes.has(suffix.name)) {
      throw new Error(`duplicate suffix ${suffix.name} added to type`);
    }

    type.suffixes.set(suffix.name, suffix);
  }
};

/**
 * Helper function to move down prototype chain
 * @param type type to query
 * @param nullValue null if function does not return
 * @param func query function
 */
const moveDownPrototype = <T>(
  type: IArgumentType,
  nullValue: T,
  func: (currentType: IArgumentType) => Maybe<T>,
): T => {
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
