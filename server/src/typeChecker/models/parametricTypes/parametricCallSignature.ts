import {
  IParametricCallSignature,
  IType,
  ICallSignature,
  IParametricType,
  TypeMap,
} from '../../types';
import { CallBinder } from '../../binders/callBinder';
import { empty } from '../../../utilities/typeGuards';

/**
 * This call represents a call signature for a type with type parameters.
 * This could likely be rolled up into the overarching type classes but
 * allowed some means of separation
 */
export class GenericCallSignature implements IParametricCallSignature {
  /**
   * name to fullfil type mappable interface
   */
  public readonly name: string;

  /**
   * type parameters mappings to parameters
   */
  private paramMaps?: TypeMap<IParametricType>[];

  /**
   * type paramter mapping to return
   */
  private returnMaps?: TypeMap<IParametricType>;

  /**
   * The call type binder
   */
  private readonly binder: CallBinder;

  /**
   * Construct a new parametric call signature
   * @param typeParameters type parameters to call signature
   */
  constructor(typeParameters: string[]) {
    this.name = 'Call Signature';
    this.binder = new CallBinder(typeParameters);
    this.paramMaps = undefined;
    this.returnMaps = undefined;
  }

  /**
   * Add parameters to this call signature
   * @param paramMaps parameters to add
   */
  public addParams(...paramMaps: TypeMap<IParametricType>[]) {
    if (!empty(this.paramMaps)) {
      throw new Error('Parameters already set');
    }

    for (const paramMap of paramMaps) {
      this.checkMapping(paramMap);
    }

    this.paramMaps = paramMaps;
  }

  /**
   * Add a return type to this call signature
   * @param returnMaps return to add
   */
  public addReturn(returnMaps: TypeMap<IParametricType>) {
    if (!empty(this.returnMaps)) {
      throw new Error('Return already set');
    }

    this.checkMapping(returnMaps);

    this.returnMaps = returnMaps;
  }

  /**
   * Check that the mapping is valid
   * @param typeMap type mapping
   */
  private checkMapping(typeMap: TypeMap<IParametricType>): void {
    const { type, mapping } = typeMap;

    // check if super has type parameters
    if (type.getTypeParameters().length > 0) {
      const superTypeParams = type.getTypeParameters();
      const thisTypeParams = this.getTypeParameters();

      // check length
      if (mapping.size !== superTypeParams.length) {
        throw new Error(
          `Type has type parameters ${superTypeParams.join(', ')}` +
            ` but was only given ${mapping.size} arguments`,
        );
      }

      // check matching
      for (const [key, value] of mapping) {
        if (!thisTypeParams.includes(key)) {
          throw new Error(
            `Type ${this.name} does not have a type parameter ${key.name}`,
          );
        }

        if (!superTypeParams.includes(value)) {
          throw new Error(
            `Type ${type.name} does not have a type parameter ${value.name}`,
          );
        }
      }
    }
  }

  /**
   * Call signature parameters
   */
  public params() {
    if (empty(this.paramMaps)) {
      throw new Error('Parameters not set');
    }

    return this.paramMaps.map(p => p.type);
  }

  /**
   * The required number of parameters
   */
  public requiredParams(): number {
    let count = 0;
    for (const param of this.paramMaps?.values() ?? []) {
      if (!param.type.noneType) {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Call signature return
   */
  public returns() {
    if (empty(this.returnMaps)) {
      throw new Error('Return not set');
    }

    return this.returnMaps.type;
  }

  /**
   * Apply type arguments to this call signature
   * @param typeArguments type arguments
   */
  public apply(
    typeArguments: IType | Map<IParametricType, IType>,
  ): ICallSignature {
    if (empty(this.returnMaps) || empty(this.paramMaps)) {
      throw new Error('Call signature not set cannot apply arguments');
    }

    // if we're an actual mapping just begin the binding
    if (typeArguments instanceof Map) {
      return this.binder.apply(typeArguments, this.paramMaps, this.returnMaps);
    }

    // use short hand check that only one type parameter exists
    const typeParameters = this.getTypeParameters();
    if (typeParameters.length !== 1) {
      throw new Error(
        'Must provide a type map if more than one parameter is present.',
      );
    }

    return this.binder.apply(
      new Map([[typeParameters[0], typeArguments]]),
      this.paramMaps,
      this.returnMaps,
    );
  }

  /**
   * Get the type parameters of this call signature
   */
  public getTypeParameters(): IParametricType[] {
    return [...this.binder.typeParameters];
  }

  /**
   * Get a string representation of this call signature
   */
  public toString(): string {
    if (empty(this.returnMaps) || empty(this.paramMaps)) {
      throw new Error(
        'Call signature not set cannot get string representation',
      );
    }

    const paramsStr = this.paramMaps.map(p => p.type.toString()).join(', ');
    return `(${paramsStr}) => ${this.returnMaps.type.toString()}`;
  }
}
