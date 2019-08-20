import {
  IParametricType,
  Access,
  TypeKind,
  TypeMap,
  IParametricCallSignature,
  OperatorKind,
  IType,
} from '../types';
import { Operator } from '../operator';
import { TypeBinding } from '../typeBinder';
import { empty } from '../../utilities/typeGuards';

export class ParametricType implements IParametricType {
  public readonly name: string;
  public readonly access: Access;
  public readonly kind: TypeKind;
  public readonly anyType: boolean;
  private callSignature?: TypeMap<IParametricCallSignature>;
  private superType?: TypeMap<IParametricType>;
  private suffixes: Map<string, TypeMap<IParametricType>>;
  private operators: Map<OperatorKind, Operator<IParametricType>[]>;
  private substitution: TypeBinding;
  private coercibleTypes: Set<IParametricType>;

  constructor(
    name: string,
    access: Access,
    typeParameters: string[],
    kind: TypeKind,
  ) {
    this.name = name;
    this.access = access;
    this.kind = kind;
    this.anyType = false;
    this.substitution = new TypeBinding(typeParameters);

    this.superType = undefined;
    this.suffixes = new Map();
    this.coercibleTypes = new Set();
    this.operators = new Map();
  }

  public addCallSignature(callSignature: TypeMap<IParametricCallSignature>) {
    this.callSignature = callSignature;
  }

  public addSuper(typeMap: TypeMap<IParametricType>): void {
    if (!empty(this.superType)) {
      throw new Error(`Super type for ${this.name} has already been set.`);
    }

    // check if super has type parameters
    this.checkMapping(typeMap);

    this.superType = typeMap;
  }

  private checkMapping(typeMap: TypeMap<IParametricType>): void {
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

  public addCoercion(...types: IParametricType[]): void {
    for (const type of types) {
      if (this.coercibleTypes.has(type)) {
        throw new Error(
          `Coercible type ${type.name} has already been added to ${this.name}`,
        );
      }

      this.coercibleTypes.add(type);
    }
  }

  public addSuffixes(...suffixes: TypeMap<IParametricType>[]): void {
    for (const suffix of suffixes) {
      if (this.suffixes.has(suffix.type.name)) {
        throw new Error(
          `Duplicate suffix of ${suffix.type.name} added to ${this.name}`,
        );
      }

      // check mapping
      this.checkMapping(suffix);

      this.suffixes.set(suffix.type.name, suffix);
    }
  }

  public addOperators(...operators: Operator<IParametricType>[]): void {
    for (const operator of operators) {
      if (!this.operators.has(operator.operator)) {
        this.operators.set(operator.operator, []);
      }

      const operatorsKind = this.operators.get(operator.operator);

      // should never happen
      if (empty(operatorsKind)) {
        throw new Error(
          `Operator kind ${OperatorKind[operator.operator]} not found for ${
            this.name
          }`,
        );
      }

      // check to make sure we didn't add two operators with the same
      // other operand
      for (const existingOperator of operatorsKind) {
        if (existingOperator.otherOperand === operator.otherOperand) {
          let message: string;
          const { otherOperand } = existingOperator;
          if (empty(otherOperand)) {
            message =
              `Operator of kind ${OperatorKind[operator.operator]}` +
              ` already exists between for ${this.name}`;
          } else {
            message =
              `Operator of kind ${
                OperatorKind[operator.operator]
              } already exists between` +
              ` ${this.name} and ${otherOperand.name}`;
          }

          throw new Error(message);
        }
      }

      operatorsKind.push(operator);
    }
  }

  public isSubtypeOf(type: IParametricType): boolean {
    if (type === this) {
      return true;
    }

    return empty(this.superType)
      ? false
      : this.superType.type.isSubtypeOf(type);
  }
  public canCoerceFrom(type: IParametricType): boolean {
    // if type no coercion needed
    if (type === this) {
      return true;
    }

    // if any type can coerce
    if (type.anyType) {
      return true;
    }

    // Are we directly a type that can be coerced
    if (this.coercibleTypes.has(type)) {
      return true;
    }

    // if we're a subtype of this type
    if (type.isSubtypeOf(this)) {
      return true;
    }

    // Are we a subtype of one of the coercible types
    for (const coercibleType of this.coercibleTypes) {
      if (type.isSubtypeOf(coercibleType)) {
        return true;
      }
    }

    return false;
  }

  public getTypeParameters(): IParametricType[] {
    return [...this.substitution.typeParameters];
  }

  public getSuperType(): IParametricType | undefined {
    return this.superType && this.superType.type;
  }

  public getCallSignature(): Maybe<IParametricCallSignature> {
    return this.callSignature && this.callSignature.type;
  }

  public getCoercions(): Set<IParametricType> {
    return this.coercibleTypes;
  }

  public getSuffixes(): Map<string, IParametricType> {
    const suffixes = new Map<string, IParametricType>();
    for (const [name, typeMap] of this.suffixes) {
      suffixes.set(name, typeMap.type);
    }

    if (!empty(this.superType)) {
      for (const [name, value] of this.superType.type.getSuffixes()) {
        suffixes.set(name, value);
      }
    }

    return suffixes;
  }

  public getOperator(
    kind: OperatorKind,
    other?: IParametricType,
  ): Maybe<Operator<IParametricType>> {
    const operators = this.operators.get(kind);

    if (empty(operators)) {
      return operators;
    }

    for (const operator of operators) {
      // check if operator is unary other see if it can coerced into other operand
      if (empty(operator.otherOperand)) {
        if (empty(other)) {
          return operator;
        }
      } else if (!empty(other) && operator.otherOperand.canCoerceFrom(other)) {
        return operator;
      }
    }

    return undefined;
  }

  public getOperators(): Map<OperatorKind, Operator<IParametricType>[]> {
    return this.operators;
  }

  public toString(): string {
    const typeParameters = this.getTypeParameters();

    const typeParameterStr =
      typeParameters.length > 0
        ? `<${typeParameters.map(t => t.toString()).join(', ')}>`
        : '';

    if (empty(this.callSignature)) {
      return `${this.name}${typeParameterStr}`;
    }

    return `${typeParameterStr}${this.callSignature.type.toString()}`;
  }

  public apply(typeSubstitutions: Map<IType, IType> | IType): IType {
    if (typeSubstitutions instanceof Map) {
      return this.substitution.replace(
        this,
        typeSubstitutions,
        this.suffixes,
        this.callSignature,
        this.superType,
      );
    }

    const typeParameters = this.getTypeParameters();
    if (typeParameters.length !== 1) {
      throw new Error(
        'Must provide a type map if more than one parameter is present.',
      );
    }
    return this.substitution.replace(
      this,
      new Map([[typeParameters[0], typeSubstitutions]]),
      this.suffixes,
      this.callSignature,
      this.superType,
    );
  }
}
