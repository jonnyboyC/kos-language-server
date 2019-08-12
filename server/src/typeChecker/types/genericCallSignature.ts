import {
  IGenericCallSignature,
  IType,
  ICallSignature,
  IGenericType,
  TypeMap,
} from '../types';
import { TypeParameter } from '../typeParameter';
import { voidType } from '../ksTypes/primitives/void';
import { CallReplacement } from '../callReplacement';
import { noMap } from '../typeCreators';
import { empty } from '../../utilities/typeGuards';

export class GenericCallSignature implements IGenericCallSignature {
  public readonly name: string;
  private paramMaps: TypeMap<IGenericType>[];
  private returnMaps: TypeMap<IGenericType>;

  private readonly replacement: CallReplacement;
  constructor(typeParameters: string[]) {
    this.name = 'Call Signature';
    this.replacement = new CallReplacement(typeParameters);
    this.paramMaps = [];
    this.returnMaps = noMap(voidType);
  }
  public addParams(...paramMaps: TypeMap<IGenericType>[]) {
    for (const paramMap of paramMaps) {
      this.checkMapping(paramMap);
    }

    this.paramMaps = paramMaps;
  }
  public addReturn(returnMaps: TypeMap<IGenericType>) {
    this.checkMapping(returnMaps);

    this.returnMaps = returnMaps;
  }

  private checkMapping(typeMap: TypeMap<IGenericType>): void {
    const { type, mapping } = typeMap;

    // check if super has type parameters
    if (type.getTypeParameters().length > 0) {
      const superTypeParams = type.getTypeParameters();
      const thisTypeParams = this.getTypeParameters();

      // if we have parameters we need a mapping between them
      if (empty(mapping)) {
        throw new Error(
          `Type ${type.name} was not passed a type parameter map`,
        );
      }

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

  public params() {
    return this.paramMaps.map(p => p.type);
  }
  public returns() {
    return this.returnMaps.type;
  }
  public toConcrete(
    typeReplacement: IType | Map<IType, IType>,
  ): ICallSignature {
    if (typeReplacement instanceof Map) {
      return this.replacement.replace(
        typeReplacement,
        this.paramMaps,
        this.returnMaps,
      );
    }

    const typeParameters = this.getTypeParameters();
    if (typeParameters.length !== 1) {
      throw new Error(
        'Must provide a type map if more than one parameter is present.',
      );
    }

    return this.replacement.replace(
      new Map([[typeParameters[0].placeHolder, typeReplacement]]),
      this.paramMaps,
      this.returnMaps,
    );
  }
  public getTypeParameters(): TypeParameter[] {
    throw new Error('Method not implemented.');
  }
  public toTypeString(): string {
    const paramsStr = this.paramMaps.map(p => p.type.toTypeString()).join(', ');

    return `(${paramsStr}) => ${this.returnMaps.type.toTypeString()}`;
  }
}
