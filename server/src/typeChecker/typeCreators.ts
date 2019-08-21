import {
  IParametricType,
  IType,
  TypeKind,
  TypeMap,
  ITypeMappable,
  IParametricIndexer,
} from './types';
import { memoize } from '../utilities/memoize';
import { ParametricType } from './parametricTypes/parametricType';
import { Type } from './types/type';
import { VariadicType } from './types/variadicType';
import { CallSignature } from './types/callSignature';
import { GenericCallSignature } from './parametricTypes/parametricCallSignature';
import { ParametricIndexer } from './parametricTypes/parametricIndexer';

/**
 * Create a placeholder generic type
 * @param name name of the placeholder
 */
export const createPlaceholder = (name: string): ParametricType => {
  return new ParametricType(
    name,
    { get: false, set: false },
    [],
    TypeKind.typeSlot,
  );
};

/**
 * Generate a new basic generic type
 * @param name name of the new generic type
 * @param typeParameterNames names of the type parameters
 */
export const createGenericStructureType = (
  name: string,
  typeParameterNames: string[],
): ParametricType => {
  return new ParametricType(
    name,
    { get: true, set: true },
    typeParameterNames,
    TypeKind.basic,
  );
};

/**
 * Create an indexer
 * @param typeParameters type parameters for the indexer
 * @param index the index type
 * @param returns the return type
 */
export const createIndexer = (
  typeParameters: string[],
  index: IParametricType | string,
  returns: IParametricType | string,
): IParametricIndexer => {
  const indexer = new ParametricIndexer(typeParameters);

  const callSignature = new GenericCallSignature(typeParameters);
  const typePlaceholders = callSignature.getTypeParameters();

  callSignature.addParams(
    mapTypeWithPlaceholder(callSignature, typePlaceholders, index),
  );

  callSignature.addReturn(
    mapTypeWithPlaceholder(callSignature, typePlaceholders, returns),
  );

  indexer.addCallSignature(mapTypes(indexer, callSignature));
  return indexer;
};

/**
 * Generate a new basic type
 * @param name name of the new type
 */
export const createStructureType = (name: string): Type => {
  return new Type(name, { get: true, set: true }, new Map(), TypeKind.basic);
};

/**
 * Generate a new generic callable suffix type
 * @param name name of the suffix
 * @param returns return type of suffix call
 * @param params parameters of suffix call
 */
export const createGenericArgSuffixType = (
  name: string,
  typeParameters: string[],
  returns: IParametricType | string,
  ...params: (IParametricType | string)[]
): ParametricType => {
  const get = params.length === 0;

  const genericType = new ParametricType(
    name.toLowerCase(),
    { get, set: false },
    typeParameters,
    TypeKind.suffix,
  );

  const callSignature = new GenericCallSignature(typeParameters);
  const typePlaceholders = callSignature.getTypeParameters();

  callSignature.addParams(
    ...params.map(p =>
      mapTypeWithPlaceholder(callSignature, typePlaceholders, p),
    ),
  );

  callSignature.addReturn(
    mapTypeWithPlaceholder(callSignature, typePlaceholders, returns),
  );

  genericType.addCallSignature(mapTypes(genericType, callSignature));
  return genericType;
};

const mapTypeWithPlaceholder = <T>(
  parentType: ITypeMappable<T>,
  typePlaceholders: IParametricType[],
  type: IParametricType | string,
): TypeMap<IParametricType> => {
  if (typeof type !== 'string') {
    if (type.getTypeParameters().length === 0) {
      return noMap(type);
    }

    return mapType(parentType, type);
  }

  for (const placeholder of typePlaceholders) {
    if (type === placeholder.name) {
      return noMap(placeholder);
    }
  }

  throw new Error(`Unable to map ${type} to a type parameter`);
};

/**
 * Generate a new callable suffix type
 * @param name name of the suffix
 * @param returns return type of suffix call
 * @param params parameters of suffix call
 */
export const createArgSuffixType = (
  name: string,
  returns: IType,
  ...params: IType[]
): Type => {
  const get = params.length === 0;

  return new Type(
    name.toLowerCase(),
    { get, set: false },
    new Map(),
    TypeKind.suffix,
    new CallSignature(params, returns),
  );
};

/**
 * Generate a new get only suffix type
 * @param name name of the suffix
 * @param returns return type of suffix
 */
export const createSuffixType = (name: string, returns: IType): Type => {
  return new Type(
    name.toLowerCase(),
    { get: true, set: false },
    new Map(),
    TypeKind.suffix,
    new CallSignature([], returns),
  );
};

/**
 * Generate a new get and set suffix type
 * @param name name of the suffix
 * @param returns return type of suffix
 */
export const createSetSuffixType = (name: string, returns: IType): Type => {
  return new Type(
    name.toLowerCase(),
    { get: true, set: true },
    new Map(),
    TypeKind.suffix,
    new CallSignature([], returns),
  );
};

/**
 * Generate a new callable variadic suffix type
 * @param name name of the suffix type
 * @param returns return type of suffix call
 * @param params variadic type of parameters
 */
export const createVarSuffixType = (
  name: string,
  returns: IType,
  params: IType,
): Type => {
  if (params.kind !== TypeKind.variadic) {
    throw new Error('Expected variadic type.');
  }

  return new Type(
    name.toLowerCase(),
    { get: false, set: false },
    new Map(),
    TypeKind.suffix,
    new CallSignature([params], returns),
  );
};

/**
 * Generate a new function type
 * @param name name of the function
 * @param returns return type of function call
 * @param params parameters of function
 */
export const createFunctionType = (
  name: string,
  returns: IType,
  ...params: IType[]
): Type => {
  return new Type(
    name.toLowerCase(),
    { get: false, set: false },
    new Map(),
    TypeKind.function,
    new CallSignature(params, returns),
  );
};

/**
 * Generate a new variadic function type
 * @param name name of the function
 * @param returns return type of function call
 * @param params variadic type of function call parameters
 */
export const createVarFunctionType = (
  name: string,
  returns: IType,
  params: IType,
): Type => {
  if (params.kind !== TypeKind.variadic) {
    throw new Error('Expected variadic type.');
  }

  return new Type(
    name.toLowerCase(),
    { get: false, set: false },
    new Map(),
    TypeKind.function,
    new CallSignature([params], returns),
  );
};

/**
 * Create variadic type
 */
export const createVarType = memoize(
  (type: IType): VariadicType => {
    if (type.kind !== TypeKind.basic) {
      throw new Error('Must provide a basic type for variadic types');
    }

    return new VariadicType(type);
  },
);

export const noMap = <T extends ITypeMappable>(type: T): TypeMap<T> => {
  return {
    type,
    mapping: new Map(),
  };
};

export const mapTypes = <T1 extends ITypeMappable, T2 extends ITypeMappable>(
  source: T1,
  target: T2,
): TypeMap<T2> => {
  const sourceParameters = source.getTypeParameters();
  const targetParameters = target.getTypeParameters();

  if (sourceParameters.length !== 1) {
    throw new Error(`Type ${source.name} has more than 1 type parameter`);
  }

  if (targetParameters.length !== 1) {
    throw new Error(`Type ${target.name} has more than 1 type parameter`);
  }

  return {
    type: target,
    mapping: new Map([[sourceParameters[0], targetParameters[0]]]),
  };
};

export const mapType = <T1 extends ITypeMappable, T2 extends IParametricType>(
  source: T1,
  target: T2,
): TypeMap<T2> => {
  const sourceParameters = source.getTypeParameters();
  const targetParameters = target.getTypeParameters();

  if (sourceParameters.length !== 1) {
    throw new Error(`Type ${source.name} has more than 1 type parameter`);
  }

  if (targetParameters.length !== 1 && target.kind !== TypeKind.typeSlot) {
    throw new Error(`Type ${target.name} has more than 1 type parameter`);
  }

  if (target.kind === TypeKind.typeSlot) {
    return {
      type: target,
      mapping: new Map([[sourceParameters[0], target]]),
    };
  }

  return {
    type: target,
    mapping: new Map([[sourceParameters[0], targetParameters[0]]]),
  };
};
