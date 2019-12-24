import {
  IType,
  Access,
  TypeKind,
  IParametricType,
  OperatorKind,
  IIndexer,
  ICallSignature,
} from '../../types';
import { TypeTracker } from '../../../analysis/models/typeTracker';
import { Operator } from './operator';
import { KsSymbol } from '../../../analysis/types';
import { KsSuffix } from '../../../models/suffix';
import { delegateType } from '../../ksTypes/primitives/delegate';

/**
 * A class representing a type in Kerboscript
 */
export class DelegateType implements IType {
  /**
   * What is the name of this union
   */
  public readonly name: string;

  /**
   * What access level does this delegate have
   */
  public readonly access: Access;

  /**
   * Is this delegate the any type
   */
  public readonly anyType: boolean;

  /**
   * Is this delegate the none type
   */
  public readonly noneType: boolean;

  /**
   * What is the type of this delegate
   */
  public readonly kind: TypeKind;

  /**
   * The tracker for this type. Should only occur if this is a suffix
   */
  private readonly typeTracker: TypeTracker;

  /**
   * The underlying function type to the delegate
   */
  private readonly function: IType;

  /**
   * Construct a new delegate type
   * @param type function type of this delegate
   */
  constructor(type: IType) {
    if (type.kind !== TypeKind.function) {
      throw new Error('Delegate only applicable to function types');
    }

    this.function = type;
    this.access = { get: true, set: true };
    this.anyType = false;
    this.noneType = false;
    this.name = 'delegate';
    this.typeTracker = new TypeTracker(new KsSuffix(this.name), this);
    this.kind = TypeKind.delegate;
  }

  /**
   * Is this delegate type a subtype of some other type
   * @param type the type to check against
   */
  public isSubtypeOf(type: IParametricType): boolean {
    if (this.subtypeCheck(type)) {
      return true;
    }

    for (const subType of type.subTypes()) {
      if (this.subtypeCheck(subType)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Individual type check for sub type ness
   * @param type the type to check against
   */
  private subtypeCheck(type: IParametricType): boolean {
    if (type === this) {
      return true;
    }

    // check if super type matches provided type
    return delegateType.isSubtypeOf(type);
  }

  /**
   * What is the assignment type of this type
   */
  public assignmentType(): IType {
    return this.function.assignmentType();
  }

  /**
   * Get the super type
   */
  public super(): Maybe<IType> {
    return delegateType;
  }

  /**
   * Sub types of this type
   */
  public subTypes(): IType[] {
    return [];
  }

  /**
   * Get the type tracker
   */
  public tracker(): TypeTracker<KsSymbol> {
    return this.typeTracker;
  }

  /**
   * Get call signature. TODO could attempt to see if the call signatures could be merged
   * somehow
   */
  public callSignature(): Maybe<ICallSignature> {
    return this.function.callSignature();
  }

  /**
   * Get indexer of this delegate type. If all types have an indexer with the same index type
   */
  public indexer(): Maybe<IIndexer> {
    return undefined;
  }

  /**
   * Get all suffixes present in all members of the delegate type
   */
  public suffixes(): Map<string, IType> {
    return delegateType.suffixes();
  }

  /**
   * Does this type have the requested suffix
   * @param name name of the suffix
   */
  public hasSuffix(name: string): boolean {
    return delegateType.hasSuffix(name);
  }

  /**
   * Attempt to access a suffix from this type
   * @param name name of the suffix
   */
  public getSuffix(name: string): Maybe<IType> {
    return delegateType.getSuffix(name);
  }

  /**
   * Get an operator for the other type
   * @param kind The operator kind
   * @param rhs the type of the other type
   */
  public getOperator(kind: OperatorKind, rhs?: IType): Maybe<Operator<IType>> {
    return delegateType.getOperator(kind, rhs);
  }

  /**
   * Get all operators. TODO attempt to merge operators
   */
  public operators(): Map<OperatorKind, Operator<IType>[]> {
    return delegateType.operators();
  }

  /**
   * Can only coerce from itself
   * @param type type to try to coerce from
   */
  public canCoerceFrom(type: IParametricType): boolean {
    return type === this;
  }

  /**
   * Get all available coercions
   */
  public coercions(): Set<IParametricType> {
    return new Set();
  }

  /**
   * Apply type arguments to this delegate type
   * @param _ type arguments
   */
  public apply(_: IType | Map<IParametricType, IType>): IType {
    return this;
  }

  /**
   * Get a string representation of this type
   */
  public toString(): string {
    return this.function.toString();
  }

  /**
   * Get the type parameters of this type
   */
  public getTypeParameters(): IParametricType[] {
    return [];
  }
}
