import { IGenericType, IType, TypeKind, TypeMap, ITypeMappable } from './types';
import { memoize } from '../utilities/memoize';
import { GenericType } from './types/genericType';
import { Type } from './types/type';
import { VariadicType } from './types/variadicType';
import { CallSignature } from './types/callSignature';
import { GenericCallSignature } from './types/genericCallSignature';

/**
 * Create a placeholder generic type
 * @param name name of the placeholder
 */
export const createPlaceholder = (name: string): IGenericType => {
  return new GenericType(
    name,
    { get: false, set: false },
    [],
    TypeKind.typePlaceholder,
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
): IGenericType => {
  return new GenericType(
    name,
    { get: true, set: true },
    typeParameterNames,
    TypeKind.basic,
  );
};

/**
 * Generate a new basic type
 * @param name name of the new type
 */
export const createStructureType = (name: string): IType => {
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
  returns: IGenericType | string,
  ...params: (IGenericType | string)[]
): IGenericType => {
  const get = params.length === 0;

  const genericType = new GenericType(
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

const mapTypeWithPlaceholder = (
  parentType: ITypeMappable,
  typePlaceholders: IGenericType[],
  type: IGenericType | string,
): TypeMap<IGenericType> => {
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
): IType => {
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
export const createSuffixType = (name: string, returns: IType): IType => {
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
export const createSetSuffixType = (name: string, returns: IType): IType => {
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
): IType => {
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
): IType => {
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
): IType => {
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
  (type: IType): IType => {
    if (type.kind !== TypeKind.basic) {
      throw new Error('Must provide a basic type for variadic types');
    }

    return new VariadicType(type);
  },
);

export const noMap = <T extends IGenericType>(type: T): TypeMap<T> => {
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

export const mapType = <T1 extends ITypeMappable, T2 extends IGenericType>(
  source: T1,
  target: T2,
): TypeMap<T2> => {
  const sourceParameters = source.getTypeParameters();
  const targetParameters = target.getTypeParameters();

  if (sourceParameters.length !== 1) {
    throw new Error(`Type ${source.name} has more than 1 type parameter`);
  }

  if (
    targetParameters.length !== 1 &&
    target.kind !== TypeKind.typePlaceholder
  ) {
    throw new Error(`Type ${target.name} has more than 1 type parameter`);
  }

  if (target.kind === TypeKind.typePlaceholder) {
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
