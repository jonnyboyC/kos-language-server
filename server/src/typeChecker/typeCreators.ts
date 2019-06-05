import {
  IGenericArgumentType,
  ArgumentType,
  IGenericSuffixType,
  CallType,
  IGenericBasicType,
  IBasicType,
  ISuffixType,
  IVariadicType,
  IFunctionType,
} from './types/types';
import { memoize } from '../utilities/memoize';
import {
  GenericBasicType,
  BasicType,
  GenericSuffixType,
  SuffixType,
  FunctionType,
  VariadicType,
} from './ksType';

/**
 * Generate a new basic generic type
 * @param name name of the new generic type
 */
export const createGenericBasicType = (
  name: string,
): IGenericArgumentType => {
  return new GenericBasicType(name);
};

/**
 * Generate a new type parameter
 * @param name naem of the type parameter
 */
export const getTypeParameter = memoize(
  (name: string): IGenericBasicType => {
    return createGenericBasicType(name);
  },
);

/**
 * The basic type parameter t
 */
export const tType = getTypeParameter('T');

/**
 * Generate a new basic type
 * @param name name of the new type
 */
export const createStructureType = (name: string): IBasicType => {
  return new BasicType(name, []);
};

/**
 * Generate a new generic callable suffix type
 * @param name name of the suffix
 * @param returns return type of suffix call
 * @param params parameters of suffix call
 */
export const createGenericArgSuffixType = (
  name: string,
  returns: IGenericArgumentType,
  ...params: IGenericArgumentType[]
): IGenericSuffixType => {
  const callType = params.length > 0 ? CallType.call : CallType.optionalCall;
  return new GenericSuffixType(name.toLowerCase(), callType, params, returns);
};

/**
 * Generate a new callable suffix type
 * @param name name of the suffix
 * @param returns return type of suffix call
 * @param params parameters of suffix call
 */
export const createArgSuffixType = (
  name: string,
  returns: ArgumentType,
  ...params: ArgumentType[]
): ISuffixType => {
  const callType = params.length > 0 ? CallType.call : CallType.optionalCall;
  return new SuffixType(name.toLowerCase(), callType, params, returns, []);
};

/**
 * Generate a new get only suffix type
 * @param name name of the suffix
 * @param returns return type of suffix
 */
export const createSuffixType = (
  name: string,
  returns: ArgumentType,
): ISuffixType => {
  return new SuffixType(name.toLowerCase(), CallType.get, [], returns, []);
};

/**
 * Generate a new get and set suffix type
 * @param name name of the suffix
 * @param returns return type of suffix
 */
export const createSetSuffixType = (
  name: string,
  returns: ArgumentType,
): ISuffixType => {
  return new SuffixType(name.toLowerCase(), CallType.set, [], returns, []);
};

/**
 * Generate a new callable variadic suffix type
 * @param name name of the suffix type
 * @param returns return type of suffix call
 * @param params variadic type of parameters
 */
export const createVarSuffixType = (
  name: string,
  returns: ArgumentType,
  params: IVariadicType,
): ISuffixType => {
  return new SuffixType(
    name.toLowerCase(),
    CallType.optionalCall,
    params,
    returns,
    [],
  );
};

/**
 * Create variadic type
 */
export const createVarType = memoize(
  (type: ArgumentType): IVariadicType => {
    return new VariadicType(type);
  },
);

/**
 * Generate a new function type
 * @param name name of the function
 * @param returns return type of function call
 * @param params parameters of function
 */
export const createFunctionType = (
  name: string,
  returns: ArgumentType,
  ...params: ArgumentType[]
): IFunctionType => {
  const callType = params.length > 0 ? CallType.call : CallType.optionalCall;
  return new FunctionType(name.toLowerCase(), callType, params, returns);
};

/**
 * Generate a new variadic function type
 * @param name name of the function
 * @param returns return type of function call
 * @param params variadic type of function call parameters
 */
export const createVarFunctionType = (
  name: string,
  returns: ArgumentType,
  params: IVariadicType,
): IFunctionType => {
  return new FunctionType(
    name.toLowerCase(),
    CallType.optionalCall,
    params,
    returns,
  );
};
