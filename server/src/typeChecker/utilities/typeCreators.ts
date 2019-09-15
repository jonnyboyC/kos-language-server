import {
  IParametricType,
  IType,
  TypeKind,
  TypeMap,
  ITypeMappable,
  IParametricIndexer,
} from '../types';
import { memoize } from '../../utilities/memoize';
import { ParametricType } from '../models/parametricTypes/parametricType';
import { Type } from '../models/types/type';
import { VariadicType } from '../models/types/variadicType';
import { CallSignature } from '../models/types/callSignature';
import { GenericCallSignature } from '../models/parametricTypes/parametricCallSignature';
import { ParametricIndexer } from '../models/parametricTypes/parametricIndexer';
import { Indexer } from '../models/types/indexer';
import { empty } from '../../utilities/typeGuards';
import { UnionType } from '../models/types/unionType';

/**
 * Create a type parameter type
 * @param name name of the placeholder
 */
export const createTypeParameter = (name: string): ParametricType => {
  return new ParametricType(
    name,
    { get: false, set: false },
    [],
    TypeKind.typeSlot,
  );
};

/**
 * Generate a new basic parametric type
 * @param name name of the new parametric type
 * @param typeParameterNames names of the type parameters
 */
export const createParametricType = (
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

const unionCache = new Map<string, IType>();

/**
 * Create an indexer
 * @param index the index type
 * @param returns the return type
 */
export const createUnion = (param: boolean, ...types: IType[]): IType => {
  // deduplicate and sort
  const sortedTypes = [...new Set(types)].sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }

    if (a.name > b.name) {
      return 1;
    }

    return 0;
  });

  const reducedTypes: IType[] = [];
  for (const type of sortedTypes) {
    let add = true;

    for (const checkType of sortedTypes) {
      if (type === checkType) {
        continue;
      }

      if (type.isSubtypeOf(checkType)) {
        add = false;
        break;
      }
    }

    if (add) {
      reducedTypes.push(type);
    }
  }

  if (reducedTypes.length === 1) {
    return reducedTypes[0];
  }

  const unionString = reducedTypes.map(type => type.toString()).join(' or ');
  const cacheHit = unionCache.get(unionString);
  if (!empty(cacheHit)) {
    return cacheHit;
  }

  const unionType = new UnionType(param, ...reducedTypes);
  unionCache.set(unionString, unionType);
  return unionType;
};

const indexerCache = new Map<string, Indexer>();

/**
 * Create an indexer
 * @param index the index type
 * @param returns the return type
 */
export const createIndexer = (index: IType, returns: IType): Indexer => {
  const indexerString = `[${index.toString()}]: ${returns.toString()}`;
  const cacheHit = indexerCache.get(indexerString);
  if (!empty(cacheHit)) {
    return cacheHit;
  }

  const indexer = new Indexer(new CallSignature([index], returns), new Map());
  indexerCache.set(indexerString, indexer);
  return indexer;
};

/**
 * Create an parametric indexer
 * @param typeParameters type parameters for the indexer
 * @param index the index type
 * @param returns the return type
 */
export const createParametricIndexer = (
  typeParameters: string[],
  index: IParametricType | string,
  returns: IParametricType | string,
): IParametricIndexer => {
  const indexer = new ParametricIndexer(typeParameters);

  const callSignature = new GenericCallSignature(typeParameters);
  const typePlaceholders = callSignature.getTypeParameters();

  callSignature.addParams(
    mapTypeWithParameters(callSignature, typePlaceholders, index),
  );

  callSignature.addReturn(
    mapTypeWithParameters(callSignature, typePlaceholders, returns),
  );

  indexer.addCallSignature(mapTypes(indexer, callSignature));
  return indexer;
};

/**
 * Generate a new basic type
 * @param name name of the new type
 */
export const createType = (name: string): Type => {
  return new Type(name, { get: true, set: true }, new Map(), TypeKind.basic);
};

/**
 * Generate a new parametric callable suffix type
 * @param name name of the suffix
 * @param returns return type of suffix call
 * @param params parameters of suffix call
 */
export const createParametricArgSuffixType = (
  name: string,
  typeParameters: string[],
  returns: IParametricType | string,
  ...params: (IParametricType | string)[]
): ParametricType => {
  const get = params.length === 0;

  const parametricType = new ParametricType(
    name.toLowerCase(),
    { get, set: false },
    typeParameters,
    TypeKind.suffix,
  );

  const callSignature = new GenericCallSignature(typeParameters);
  const typePlaceholders = callSignature.getTypeParameters();

  callSignature.addParams(
    ...params.map(p =>
      mapTypeWithParameters(callSignature, typePlaceholders, p),
    ),
  );

  callSignature.addReturn(
    mapTypeWithParameters(callSignature, typePlaceholders, returns),
  );

  parametricType.addCallSignature(mapTypes(parametricType, callSignature));
  return parametricType;
};

/**
 * Type map with string as parameter slot placeholder
 * @param parentType parent type
 * @param typeParameters the type parameters
 * @param type the type to map
 */
const mapTypeWithParameters = <T>(
  parentType: ITypeMappable<T>,
  typeParameters: IParametricType[],
  type: IParametricType | string,
): TypeMap<IParametricType> => {
  if (typeof type !== 'string') {
    if (type.getTypeParameters().length === 0) {
      return noMap(type);
    }

    return mapType(parentType, type);
  }

  for (const placeholder of typeParameters) {
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

/**
 * Create a type map with no parameter mapping
 * @param type type to map
 */
export const noMap = <T extends ITypeMappable>(type: T): TypeMap<T> => {
  return {
    type,
    mapping: new Map(),
  };
};

/**
 * Map a types parameters from a source to a target, assumes only one parameter
 * @param source source type
 * @param target target type
 */
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

/**
 * Map type parameters from a source to a target or a target type to the source's type parameters
 * @param source source type
 * @param target target type
 */
const mapType = <T1 extends ITypeMappable, T2 extends IParametricType>(
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
