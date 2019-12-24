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
import { empty } from '../../../utilities/typeGuards';
import { createIndexer } from '../../utilities/typeCreators';

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
   * Is this union the none type
   */
  public readonly noneType: boolean;

  /**
   * What is the type of this union
   */
  public readonly kind: TypeKind;

  /**
   * The tracker for this type. Should only occur if this is a suffix
   */
  private readonly typeTracker: TypeTracker;

  /**
   * What are the internal type of this union
   */
  public readonly types: IType[];

  /**
   * Is this type parameter for a boolean
   */
  private readonly param: boolean;

  /**
   * Construct a new union type
   * @param isParameter Is this for a call parameter
   * @param types types of the union
   */
  constructor(isParameter: boolean, ...types: IType[]) {
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

    this.param = isParameter;
    this.types = sortedTypes;
    this.name = 'Union';
    this.anyType = sortedTypes.some(type => type.anyType);
    this.noneType = sortedTypes.some(type => type.noneType);
    this.access = {
      get: sortedTypes.every(type => type.access.get),
      set: sortedTypes.every(type => type.access.set),
    };
    this.kind = sortedTypes[0].kind;
    this.typeTracker = new TypeTracker(new KsSuffix(this.name), this);
  }

  /**
   * Is this union type a subtype of some other type
   * @param type the type to check against
   */
  public isSubtypeOf(type: IParametricType): boolean {
    if (type === this) {
      return true;
    }

    if (type instanceof UnionType) {
      // if every member has a subtype then we're a subtype
      for (const unionType of type.types) {
        if (
          !this.types.some(thisUnionType =>
            thisUnionType.isSubtypeOf(unionType),
          )
        ) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * What is the assignment type of this type
   */
  public assignmentType(): IType {
    const assignmentTypes = new Set(
      this.types.map(type => type.assignmentType()),
    );
    if (assignmentTypes.size > 1) {
      return new UnionType(false, ...assignmentTypes);
    }

    return [...assignmentTypes][0];
  }

  /**
   * Get the super type
   */
  public super(): Maybe<IType> {
    return undefined;
  }

  /**
   * The sub types of this type
   */
  public subTypes(): IType[] {
    return this.types;
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
    return undefined;
  }

  /**
   * Get indexer of this union type. If all types have an indexer with the same index type
   */
  public indexer(): Maybe<IIndexer> {
    const indexer = this.types[0].indexer();
    if (empty(indexer)) {
      return undefined;
    }
    const callSignature = indexer.callSignature();
    if (empty(callSignature)) {
      return undefined;
    }

    const returns = new Set<IType>();

    const same = this.types.every(type => {
      const typeIndexer = type.indexer();
      if (empty(typeIndexer)) {
        return false;
      }

      const typeCallSignature = typeIndexer.callSignature();
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

    return createIndexer(
      callSignature.params()[0],
      new UnionType(false, ...returns),
    );
  }

  /**
   * Get all suffixes present in all members of the union type
   */
  public suffixes(): Map<string, IType> {
    const suffixes = new Map<string, IType>();
    for (const [name, suffix] of this.types[0].suffixes()) {
      let allContain = true;

      for (const type of this.types) {
        const unionSuffix = type.suffixes().get(name);
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
   * Does this type have the requested suffix TODO this may be an issue where
   * a union has two suffixes of the same name but not the same type
   * @param name name of the suffix
   */
  public hasSuffix(name: string): boolean {
    return this.types.every(type => type.hasSuffix(name));
  }

  /**
   * Attempt to retrieve a suffix from this type TODO this may be an issue where
   * a union has two suffixes of the same name but not the same type
   * @param name name of the suffix
   */
  public getSuffix(name: string): Maybe<IType> {
    const suffix = this.types[0].getSuffix(name);
    if (empty(suffix)) {
      return suffix;
    }

    return this.types.slice(1).every(type => type.getSuffix(name) === suffix)
      ? suffix
      : undefined;
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
  public operators(): Map<OperatorKind, Operator<IType>[]> {
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
  public coercions(): Set<IParametricType> {
    const coercions = new Set<IParametricType>();
    for (const type of this.types) {
      for (const coercion of type.coercions()) {
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
    if (this.param) {
      const optional = this.types.some(type => type.name === 'none');

      if (optional) {
        if (this.types.length <= 2) {
          return this.types
            .filter(type => type.name !== 'none')
            .map(type => `${type.toString()}?`)
            .join(' or ');
        }

        const typeString = this.types
          .filter(type => type.name !== 'none')
          .map(type => type.toString())
          .join(' or ');

        return `(${typeString})?`;
      }

      return this.types.map(type => type.toString()).join(' or ');
    }

    return this.types.map(type => type.toString()).join(' or ');
  }

  /**
   * Get the type parameters of this type
   */
  public getTypeParameters(): IParametricType[] {
    return [];
  }
}
