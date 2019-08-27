import {
  IType,
  Access,
  TypeKind,
  IParametricType,
  OperatorKind,
  IIndexer,
  ICallSignature,
} from '../types';
import { TypeTracker } from '../../analysis/typeTracker';
import { Operator } from './operator';
import { KsSymbol } from '../../analysis/types';
import { KsSuffix } from '../../entities/suffix';
import { empty } from '../../utilities/typeGuards';
import { createIndexer } from '../typeCreators';

/**
 * A class representing a type in Kerboscript
 */
export class UnionType implements IType {
  /**
   * What is the name of this union
   */
  public readonly name: string;

  /**
   * What access level does this union have
   */
  public readonly access: Access;

  /**
   * Is this union the any type
   */
  public readonly anyType: boolean;

  /**
   * What is the type of this union
   */
  public readonly kind: TypeKind;

  /**
   * The tracker for this type. Should only occur if this is a suffix
   */
  private readonly tracker: TypeTracker;

  /**
   * What are the internal type of this union
   */
  private readonly types: IType[];

  /**
   * Construct a new union type
   * @param types types of the union
   */
  constructor(...types: IType[]) {
    if (types.length < 2) {
      throw new Error('Union must be at least two types');
    }

    if (!types.every(type => type.kind === types[0].kind)) {
      throw new Error('Union must be the same type');
    }

    const sortedTypes = types.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }

      if (a.name > b.name) {
        return 1;
      }

      return 0;
    });

    this.types = sortedTypes;
    this.name = 'Union';
    this.anyType = sortedTypes.every(type => type.anyType);
    this.access = {
      get: sortedTypes.every(type => type.access.get),
      set: sortedTypes.every(type => type.access.set),
    };
    this.kind = sortedTypes[0].kind;
    this.tracker = new TypeTracker(new KsSuffix(this.name), this);
  }

  /**
   * Is this union type a subtype of some other type
   * @param type the type to check against
   */
  public isSubtypeOf(type: IParametricType): boolean {
    if (type === this) {
      return true;
    }

    return this.types.some(unionType => unionType.isSubtypeOf(type));
  }

  /**
   * What is the assignment type of this type
   */
  public getAssignmentType(): IType {
    const assignmentTypes = new Set(
      this.types.map(type => type.getAssignmentType()),
    );
    if (assignmentTypes.size > 1) {
      return new UnionType(...assignmentTypes);
    }

    return [...assignmentTypes][0];
  }

  /**
   * Get the super type
   */
  public getSuperType(): Maybe<IType> {
    return undefined;
  }

  /**
   * Get the type tracker
   */
  public getTracker(): TypeTracker<KsSymbol> {
    return this.tracker;
  }

  /**
   * Get call signature. TODO could attempt to see if the call signatures could be merged
   * somehow
   */
  public getCallSignature(): Maybe<ICallSignature> {
    return undefined;
  }

  /**
   * Get indexer of this union type. If all types have an indexer with the same index type
   */
  public getIndexer(): Maybe<IIndexer> {
    const indexer = this.types[0].getIndexer();
    if (empty(indexer)) {
      return undefined;
    }
    const callSignature = indexer.getCallSignature();
    if (empty(callSignature)) {
      return undefined;
    }

    const returns = new Set<IType>();

    const same = this.types.every(type => {
      const typeIndexer = type.getIndexer();
      if (empty(typeIndexer)) {
        return false;
      }

      const typeCallSignature = typeIndexer.getCallSignature();
      if (empty(typeCallSignature)) {
        return false;
      }

      returns.add(typeCallSignature.returns());
      return typeCallSignature.params()[0] === callSignature.params()[0];
    });

    if (!same) {
      return undefined;
    }

    if (returns.size === 1) {
      return indexer;
    }

    return createIndexer(callSignature.params()[0], new UnionType(...returns));
  }

  /**
   * Get all suffixes present in all members of the union type
   */
  public getSuffixes(): Map<string, IType> {
    const suffixes = new Map<string, IType>();
    for (const [name, suffix] of this.types[0].getSuffixes()) {
      let allContain = true;

      for (const type of this.types) {
        const unionSuffix = type.getSuffixes().get(name);
        if (empty(unionSuffix) || unionSuffix !== suffix) {
          allContain = false;
          break;
        }

        if (!allContain) {
          break;
        }
      }

      if (allContain) {
        suffixes.set(name, suffix);
      }
    }

    return suffixes;
  }

  /**
   * Get an operator for the other type
   * @param _ The operator kind
   * @param __ the type of the other type
   */
  public getOperator(_: OperatorKind, __?: IType): Maybe<Operator<IType>> {
    return undefined;
  }

  /**
   * Get all operators. TODO attempt to merge operators
   */
  public getOperators(): Map<OperatorKind, Operator<IType>[]> {
    return new Map();
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

    return this.types.some(unionType => unionType.canCoerceFrom(type));
  }

  /**
   * Get all available coercions
   */
  public getCoercions(): Set<IParametricType> {
    const coercions = new Set<IParametricType>();
    for (const type of this.types) {
      for (const coercion of type.getCoercions()) {
        coercions.add(coercion);
      }
    }

    return coercions;
  }

  /**
   * Apply type arguments to this union type
   * @param _ type arguments
   */
  public apply(_: IType | Map<IParametricType, IType>): IType {
    return this;
  }

  /**
   * Get a string representation of this type
   */
  public toString(): string {
    return this.types.map(type => type.toString()).join(' or ');
  }

  /**
   * Get the type parameters of this type
   */
  public getTypeParameters(): IParametricType[] {
    return [];
  }
}
