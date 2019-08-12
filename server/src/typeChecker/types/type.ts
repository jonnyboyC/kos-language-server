import {
  IType,
  Access,
  ICallSignature,
  TypeKind,
  IGenericType,
  OperatorKind,
  TypeMap,
} from '../types';
import { TypeTracker } from '../../analysis/typeTracker';
import { TypeReplacement } from '../typeReplacement';
import { Operator } from '../operator';
import { KsSuffix } from '../../entities/suffix';
import { empty } from '../../utilities/typeGuards';
import { TypeParameter } from '../typeParameter';

export class Type implements IType {
  public readonly typeSubstitutions: Map<IType, IType>;
  public readonly name: string;
  public readonly access: Access;
  public readonly callSignature?: ICallSignature;
  public readonly kind: TypeKind;
  public readonly anyType: boolean;

  private tracker: TypeTracker;
  private substitution: TypeReplacement;
  private superType?: IType;
  private typeTemplate?: IGenericType;
  private coercibleTypes: Set<IGenericType>;
  private suffixes: Map<string, IType>;
  private operators: Map<OperatorKind, Operator<IType>[]>;

  constructor(
    name: string,
    access: Access,
    typeParameters: string[],
    typeSubstitutions: Map<IType, IType>,
    kind: TypeKind,
    callSignature?: ICallSignature,
    typeTemplate?: IGenericType,
    anyType = false,
  ) {
    if (kind === TypeKind.variadic) {
      throw new Error('Cannot construct variadic type.');
    }

    this.name = name;
    this.access = access;
    this.substitution = new TypeReplacement(typeParameters);
    this.typeSubstitutions = typeSubstitutions;
    this.kind = kind;
    this.callSignature = callSignature;
    this.typeTemplate = typeTemplate;
    this.anyType = anyType;

    // TODO will need to actually be robust about this
    this.tracker = new TypeTracker(new KsSuffix(name), this);
    this.coercibleTypes = new Set();
    this.suffixes = new Map();
    this.operators = new Map();
  }

  public addSuper(typeMap: TypeMap<IType>): void {
    if (!empty(this.superType)) {
      throw new Error(`Super type for ${this.name} has already been set.`);
    }

    this.superType = typeMap.type;
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
  public addSuffixes(...suffixes: TypeMap<IType>[]): void {
    for (const { type } of suffixes) {
      if (this.suffixes.has(type.name)) {
        throw new Error(
          `Duplicate suffix of ${type.name} added to ${this.name}`,
        );
      }

      this.suffixes.set(type.name, type);
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
  public canCoerceFrom(type: IGenericType): boolean {
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
  public getTypeParameters(): TypeParameter[] {
    return [...this.substitution.typeParameters];
  }
  public getSuperType(): Maybe<IType> {
    return this.superType;
  }
  public getCallSignature(): Maybe<ICallSignature> {
    return this.callSignature;
  }
  public getTracker(): TypeTracker {
    return this.tracker;
  }
  public getAssignmentType(): IType {
    if (empty(this.callSignature)) {
      return this;
    }

    return this.callSignature.returns();
  }
  public getCoercions(): Set<IGenericType> {
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
      if (!empty(this.superType)) {
        return this.superType.getOperator(kind, other);
      }

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
        const typeArgument = this.typeSubstitutions.get(
          typeParameter.placeHolder,
        );
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
      return `${this.name}${typeArgumentsStr}`;
    }

    return `${typeArgumentsStr}${this.callSignature.toTypeString()}`;
  }

  public toConcrete(_: Map<IType, IType> | IType): IType {
    return this;
  }
}
