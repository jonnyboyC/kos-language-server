import { empty } from '../utilities/typeGuards';
import { TypeSubstitution } from './typeSubstitution';
import {
  OperatorKind,
  TypeKind,
  IGenericType,
  Access,
  CallSignature,
  IType,
} from './types';
import { Operator } from './operator';
import { TypeParameter } from './typeParameter';
import { TypeTracker } from '../analysis/typeTracker';
import { KsSuffix } from '../entities/suffix';

export class GenericType implements IGenericType {
  public readonly name: string;
  public readonly access: Access;
  public readonly callSignature?: CallSignature<IGenericType>;
  public readonly kind: TypeKind;

  private superType?: IGenericType;
  private typeParameterLink?: Map<TypeParameter, TypeParameter>;
  private substitution: TypeSubstitution;
  private coercibleTypes: Set<IGenericType>;
  private suffixes: Map<string, IGenericType>;
  private operators: Map<OperatorKind, Operator<IGenericType>[]>;

  constructor(
    name: string,
    access: Access,
    typeParameters: string[],
    kind: TypeKind,
    callSignature?: CallSignature<IGenericType>,
  ) {
    this.name = name;
    this.access = access;
    this.callSignature = callSignature;
    this.kind = kind;
    this.substitution = new TypeSubstitution(typeParameters);
    this.coercibleTypes = new Set();
    this.suffixes = new Map();
    this.operators = new Map();
  }

  public addSuper(
    type: IGenericType,
    typeParameterLink?: Map<TypeParameter, TypeParameter>,
  ): void {
    if (!empty(this.superType)) {
      throw new Error(`Super type for ${this.name} has already been set.`);
    }

    if (type.getTypeParameters().length > 0) {
      const superTypeParams = type.getTypeParameters();
      const thisTypeParams = this.getTypeParameters();

      if (empty(typeParameterLink)) {
        throw new Error(
          `Super type ${type.name} was not passed a type parameter map`,
        );
      }

      if (typeParameterLink.size !== superTypeParams.length) {
        throw new Error(
          `Super type has type parameters ${superTypeParams.join(', ')}` +
            ` but was only given ${typeParameterLink.size} arguments`,
        );
      }

      for (const [key, value] of typeParameterLink) {
        if (!thisTypeParams.includes(key)) {
          throw new Error(
            `Type ${this.name} does not have a type parameter ${key.name}`,
          );
        }

        if (!superTypeParams.includes(value)) {
          throw new Error(
            `Super type ${type.name} does not have a type parameter ${
              value.name
            }`,
          );
        }
      }

      this.typeParameterLink = typeParameterLink;
    }

    this.superType = type;
  }

  public addCoercion(...types: IGenericType[]): void {
    for (const type of types) {
      if (this.coercibleTypes.has(type)) {
        throw new Error(
          `Coercible type ${type.name} has already been added to ${this.name}`,
        );
      }

      this.coercibleTypes.add(type);
    }
  }

  public addSuffixes(...suffixes: IGenericType[]): void {
    for (const suffix of suffixes) {
      if (this.suffixes.has(suffix.name)) {
        throw new Error(
          `Duplicate suffix of ${suffix.name} added to ${this.name}`,
        );
      }

      this.suffixes.set(suffix.name, suffix);
    }
  }

  public addOperators(...operators: Operator<IGenericType>[]): void {
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

  public isSubtypeOf(type: IGenericType): boolean {
    if (type === this) {
      return true;
    }

    return empty(this.superType) ? false : this.superType.isSubtypeOf(type);
  }
  public canCoerceFrom(type: IGenericType): boolean {
    // if type no coercion needed
    if (type === this) {
      return true;
    }

    // Are we directly a type that can be coerced
    if (this.coercibleTypes.has(type)) {
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

  public getTypeParameters(): TypeParameter[] {
    return [...this.substitution.typeParameters];
  }

  public getSuperType(): IGenericType | undefined {
    return this.superType;
  }

  public getCoercions(): Set<IGenericType> {
    return this.coercibleTypes;
  }

  public getSuffix(name: string): IGenericType | undefined {
    const suffix = this.suffixes.get(name);
    if (!empty(suffix)) {
      return suffix;
    }

    return empty(this.superType) ? undefined : this.superType.getSuffix(name);
  }

  public getSuffixes(): Map<string, IGenericType> {
    const suffixes = new Map(this.suffixes.entries());

    if (!empty(this.superType)) {
      for (const [key, value] of this.superType.getSuffixes()) {
        suffixes.set(key, value);
      }
    }

    return suffixes;
  }

  public getOperator(
    kind: OperatorKind,
    other?: IGenericType,
  ): Maybe<Operator<IGenericType>> {
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

  public getOperators(): Map<OperatorKind, Operator<IGenericType>[]> {
    return this.operators;
  }

  public toTypeString(): string {
    const typeParameters = this.getTypeParameters();

    const typeParameterStr =
      typeParameters.length > 0
        ? `<${typeParameters.map(t => t.toTypeString()).join(', ')}>`
        : '';

    if (empty(this.callSignature)) {
      return this.kind === TypeKind.variadic
        ? `...${this.name}${typeParameterStr}`
        : `${this.name}${typeParameterStr}`;
    }

    return this.callToTypeString(this.callSignature, typeParameterStr);
  }

  private callToTypeString(
    callSignature: CallSignature<IGenericType>,
    typeParameterStr: string,
  ): string {
    const paramsStr = callSignature.params
      .map(p => p.toTypeString())
      .join(', ');
    return `${typeParameterStr}(${paramsStr}) => ${callSignature.returns.toTypeString()}`;
  }

  public toConcreteType(typeArguments: Map<string, IType> | IType): IType {
    if (typeArguments instanceof Map) {
      return this.substitution.substitute(
        this,
        typeArguments,
        this.typeParameterLink,
      );
    }

    const typeParameters = this.getTypeParameters();
    if (typeParameters.length !== 1) {
      throw new Error(
        'Must provide a type map if more than one parameter is present.',
      );
    }
    return this.substitution.substitute(
      this,
      new Map([[typeParameters[0].name, typeArguments]]),
      this.typeParameterLink,
    );
  }
}

export class Type implements IType {
  public readonly typeArguments: Map<string, IType>;
  public readonly name: string;
  public readonly access: Access;
  public readonly callSignature?: CallSignature<IType>;
  public readonly kind: TypeKind;

  private tracker: TypeTracker;
  private superType?: IType;
  private typeTemplate?: IGenericType;
  private coercibleTypes: Set<IType>;
  private suffixes: Map<string, IType>;
  private operators: Map<OperatorKind, Operator<IType>[]>;

  constructor(
    name: string,
    access: Access,
    typeArguments: Map<string, IType>,
    kind: TypeKind,
    callSignature?: CallSignature,
    typeTemplate?: IGenericType,
  ) {
    this.name = name;
    this.access = access;
    this.typeArguments = typeArguments;
    this.kind = kind;
    this.callSignature = callSignature;
    this.typeTemplate = typeTemplate;

    // TODO will need to actually be robust about this
    this.tracker = new TypeTracker(new KsSuffix(name), this);
    this.coercibleTypes = new Set();
    this.suffixes = new Map();
    this.operators = new Map();
  }

  public addSuper(type: IType, _?: Map<TypeParameter, TypeParameter>): void {
    if (!empty(this.superType)) {
      throw new Error(`Super type for ${this.name} has already been set.`);
    }

    this.superType = type;
  }
  public addCoercion(...types: IType[]): void {
    for (const type of types) {
      if (this.coercibleTypes.has(type)) {
        throw new Error(
          `Coercible type ${type.name} has already been added to ${this.name}`,
        );
      }

      this.coercibleTypes.add(type);
    }
  }
  public addSuffixes(...suffixes: IType[]): void {
    for (const suffix of suffixes) {
      if (this.suffixes.has(suffix.name)) {
        throw new Error(
          `Duplicate suffix of ${suffix.name} added to ${this.name}`,
        );
      }

      this.suffixes.set(suffix.name, suffix);
    }
  }
  public addOperators(...operators: Operator<IType>[]): void {
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
  public isSubtypeOf(type: IType): boolean {
    if (type === this) {
      return true;
    }

    // check if super type matches provided type
    if (!empty(this.superType)) {
      const isSubtype = this.superType.isSubtypeOf(type);
      if (isSubtype) {
        return isSubtype;
      }
    }

    // check if type template matches provided type
    if (!empty(this.typeTemplate)) {
      const isSubtype = this.typeTemplate.isSubtypeOf(type);
      if (isSubtype) {
        return isSubtype;
      }
    }

    return false;
  }
  public canCoerceFrom(type: IType): boolean {
    // if type no coercion needed
    if (type === this) {
      return true;
    }

    // Are we directly a type that can be coerced
    if (this.coercibleTypes.has(type)) {
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
  public getTypeParameters(): TypeParameter[] {
    return [];
  }
  public getSuperType(): Maybe<IType> {
    return this.superType;
  }
  public getTracker(): TypeTracker {
    return this.tracker;
  }
  public getAssignmentType(): IType {
    if (empty(this.callSignature)) {
      return this;
    }

    return this.callSignature.returns;
  }
  public getCoercions(): Set<IType> {
    return this.coercibleTypes;
  }
  public getSuffix(name: string): Maybe<IType> {
    const suffix = this.suffixes.get(name);
    if (!empty(suffix)) {
      return suffix;
    }

    return empty(this.superType) ? undefined : this.superType.getSuffix(name);
  }
  public getSuffixes(): Map<string, IType> {
    const suffixes = new Map(this.suffixes.entries());

    if (!empty(this.superType)) {
      for (const [key, value] of this.superType.getSuffixes()) {
        suffixes.set(key, value);
      }
    }

    return suffixes;
  }
  public getOperator(
    kind: OperatorKind,
    other?: Maybe<IType>,
  ): Maybe<Operator<IType>> {
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
  getOperators(): Map<OperatorKind, Operator<IType>[]> {
    return this.operators;
  }
  toTypeString(): string {
    const typeParameters = this.getTypeParameters();

    let typeArgumentsStr: string;
    if (typeParameters.length === 0) {
      typeArgumentsStr = '';
    } else {
      const typeArgumentStrs: string[] = [];
      for (const typeParameter of typeParameters) {
        const typeArgument = this.typeArguments.get(typeParameter.name);
        if (empty(typeArgument)) {
          throw new Error(
            `Type argument not found for parameter ${typeParameter}` +
              ` for type ${this.name}`,
          );
        }

        typeArgumentStrs.push(typeArgument.toTypeString());
      }

      typeArgumentsStr = `<${typeArgumentStrs.join(', ')}>`;
    }

    if (empty(this.callSignature)) {
      return this.kind === TypeKind.variadic
        ? `...${this.name}${typeArgumentsStr}`
        : `${this.name}${typeArgumentsStr}`;
    }

    return this.callToTypeString(this.callSignature, typeArgumentsStr);
  }

  private callToTypeString(
    callSignature: CallSignature,
    typeArgumentsStr: string,
  ): string {
    const paramsStr = callSignature.params
      .map(p => p.toTypeString())
      .join(', ');
    return `${typeArgumentsStr}(${paramsStr}) => ${callSignature.returns.toTypeString()}`;
  }

  toConcreteType(_: Map<string, IType> | IType): IType {
    return this;
  }
}

/**
 * Represents a constant type, or a type with a fixed value
 */
export class ConstantType<T> extends Type {
  public readonly value: T;

  /**
   * Construct a constant type
   * @param name name of this constant type
   * @param value value of this constant type
   */
  constructor(
    name: string,
    value: T,
    access: Access,
    typeArguments: Map<string, IType>,
    kind: TypeKind,
    callSignature?: CallSignature,
    typeTemplate?: IGenericType,
  ) {
    super(name, access, typeArguments, kind, callSignature, typeTemplate);
    this.value = value;
  }

  /**
   * Create a type string from this type
   */
  public toTypeString(): string {
    return `${super.toTypeString()} = ${this.value}`;
  }
}
