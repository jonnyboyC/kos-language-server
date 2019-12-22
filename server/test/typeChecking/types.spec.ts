import { stringType } from '../../src/typeChecker/ksTypes/primitives/string';
import { booleanType } from '../../src/typeChecker/ksTypes/primitives/boolean';
import { structureType } from '../../src/typeChecker/ksTypes/primitives/structure';
import { partType } from '../../src/typeChecker/ksTypes/parts/part';
import { dockingPortType } from '../../src/typeChecker/ksTypes/parts/dockingPort';
import {
  createType,
  createSuffixType,
  createArgSuffixType,
  noMap,
  createParametricType,
  mapTypes,
  createUnion,
} from '../../src/typeChecker/utilities/typeCreators';
import { typeInitializer } from '../../src/typeChecker/initialize';
import { userListType } from '../../src/typeChecker/ksTypes/collections/userList';
import { listType } from '../../src/typeChecker/ksTypes/collections/list';
import { collectionType } from '../../src/typeChecker/ksTypes/collections/enumerable';
import { scalarType } from '../../src/typeChecker/ksTypes/primitives/scalar';
import { TypeKind } from '../../src/typeChecker/types';
import { ParametricType } from '../../src/typeChecker/models/parametricTypes/parametricType';
import { Type } from '../../src/typeChecker/models/types/type';
import { UnionType } from '../../src/typeChecker/models/types/unionType';
import { noneType } from '../../src/typeChecker/ksTypes/primitives/none';
import { DelegateType } from '../../src/typeChecker/models/types/delegateType';
import { delegateType } from '../../src/typeChecker/ksTypes/primitives/delegate';
import { CallSignature } from '../../src/typeChecker/models/types/callSignature';

typeInitializer();

describe('Type', () => {
  test('Basic Attributes', () => {
    const templateType = createParametricType('Template', ['T']);

    const type = new Type(
      'example',
      { get: true, set: true },
      new Map([
        [
          templateType.getTypeParameters()[0],
          new Type(
            'integer',
            { get: true, set: true },
            new Map(),
            TypeKind.basic,
          ),
        ],
      ]),
      TypeKind.basic,
      undefined,
      templateType,
      false,
    );

    expect(type.kind).toBe(TypeKind.basic);
    expect(type.name).toBe('example');
    expect(type.access.get).toBe(true);
    expect(type.access.set).toBe(true);
    expect(type.callSignature()).toBeUndefined();
    expect(type.anyType).toBe(false);
    expect(type.super()).toBeUndefined();
    expect(type.toString()).toBe('example<integer>');

    const genericTypeParameters = type.getTypeParameters();
    expect(genericTypeParameters).toHaveLength(1);
    expect(genericTypeParameters[0].name).toBe('T');

    const exampleType = type.apply(stringType);
    expect(exampleType).toBe(type);
    expect(type.isSubtypeOf(templateType)).toBe(true);
  });

  test('Is Subtype 1', () => {
    expect(stringType.isSubtypeOf(stringType)).toBe(true);
    expect(stringType.isSubtypeOf(booleanType)).toBe(false);
    expect(stringType.isSubtypeOf(structureType)).toBe(true);
    expect(stringType.isSubtypeOf(partType)).toBe(false);
    expect(stringType.isSubtypeOf(dockingPortType)).toBe(false);

    expect(booleanType.isSubtypeOf(stringType)).toBe(false);
    expect(booleanType.isSubtypeOf(booleanType)).toBe(true);
    expect(booleanType.isSubtypeOf(structureType)).toBe(true);
    expect(booleanType.isSubtypeOf(partType)).toBe(false);
    expect(booleanType.isSubtypeOf(dockingPortType)).toBe(false);

    expect(structureType.isSubtypeOf(stringType)).toBe(false);
    expect(structureType.isSubtypeOf(booleanType)).toBe(false);
    expect(structureType.isSubtypeOf(structureType)).toBe(true);
    expect(structureType.isSubtypeOf(partType)).toBe(false);
    expect(structureType.isSubtypeOf(dockingPortType)).toBe(false);

    expect(partType.isSubtypeOf(stringType)).toBe(false);
    expect(partType.isSubtypeOf(booleanType)).toBe(false);
    expect(partType.isSubtypeOf(structureType)).toBe(true);
    expect(partType.isSubtypeOf(partType)).toBe(true);
    expect(partType.isSubtypeOf(dockingPortType)).toBe(false);

    expect(dockingPortType.isSubtypeOf(stringType)).toBe(false);
    expect(dockingPortType.isSubtypeOf(booleanType)).toBe(false);
    expect(dockingPortType.isSubtypeOf(structureType)).toBe(true);
    expect(dockingPortType.isSubtypeOf(partType)).toBe(true);
    expect(dockingPortType.isSubtypeOf(dockingPortType)).toBe(true);
  });

  test('Is Subtype 2', () => {
    const aType = createType('a');
    const bType = createType('b');
    const cType = createType('c');

    bType.addSuper(noMap(aType));
    cType.addSuper(noMap(aType));

    expect(bType.isSubtypeOf(aType)).toBe(true);
    expect(cType.isSubtypeOf(aType)).toBe(true);

    expect(aType.isSubtypeOf(bType)).toBe(false);
    expect(cType.isSubtypeOf(bType)).toBe(false);

    expect(bType.isSubtypeOf(cType)).toBe(false);
    expect(aType.isSubtypeOf(cType)).toBe(false);
  });

  test('Has Suffix', () => {
    const aType = createType('a');
    const bType = createType('b');
    const cType = createType('c');
    const dType = createType('d');

    aType.addSuffixes(
      noMap(createSuffixType('example1', cType)),
      noMap(createSuffixType('example2', cType)),
    );

    bType.addSuffixes(noMap(createSuffixType('example3', cType)));

    bType.addSuper(noMap(aType));

    cType.addSuffixes(noMap(createArgSuffixType('example', dType, dType)));

    expect(aType.suffixes().get('example1')).toBeDefined();
    expect(aType.suffixes().get('example2')).toBeDefined();
    expect(aType.suffixes().get('example3')).toBeUndefined();

    expect(bType.suffixes().get('example1')).toBeDefined();
    expect(bType.suffixes().get('example2')).toBeDefined();
    expect(bType.suffixes().get('example3')).toBeDefined();
    expect(bType.suffixes().get('other')).toBeUndefined();

    expect(cType.suffixes().get('example')).toBeDefined();
    expect(cType.suffixes().get('other')).toBeUndefined();

    expect(dType.suffixes().get('any')).toBeUndefined();
  });

  test('Can Coerce', () => {
    expect(structureType.canCoerceFrom(scalarType)).toBe(true);
    expect(structureType.canCoerceFrom(booleanType)).toBe(true);
    expect(structureType.canCoerceFrom(stringType)).toBe(true);
    expect(structureType.canCoerceFrom(collectionType)).toBe(true);
    expect(structureType.canCoerceFrom(listType)).toBe(true);
    expect(structureType.canCoerceFrom(userListType)).toBe(true);

    expect(scalarType.canCoerceFrom(structureType)).toBe(true);
    expect(scalarType.canCoerceFrom(booleanType)).toBe(false);
    expect(scalarType.canCoerceFrom(stringType)).toBe(false);
    expect(scalarType.canCoerceFrom(collectionType)).toBe(false);
    expect(scalarType.canCoerceFrom(listType)).toBe(false);
    expect(scalarType.canCoerceFrom(userListType)).toBe(false);

    expect(booleanType.canCoerceFrom(structureType)).toBe(true);
    expect(booleanType.canCoerceFrom(scalarType)).toBe(true);
    expect(booleanType.canCoerceFrom(stringType)).toBe(true);
    expect(booleanType.canCoerceFrom(collectionType)).toBe(true);
    expect(booleanType.canCoerceFrom(listType)).toBe(true);
    expect(booleanType.canCoerceFrom(userListType)).toBe(true);

    expect(stringType.canCoerceFrom(structureType)).toBe(true);
    expect(stringType.canCoerceFrom(scalarType)).toBe(true);
    expect(stringType.canCoerceFrom(booleanType)).toBe(true);
    expect(stringType.canCoerceFrom(collectionType)).toBe(true);
    expect(stringType.canCoerceFrom(listType)).toBe(true);
    expect(stringType.canCoerceFrom(userListType)).toBe(true);

    expect(collectionType.canCoerceFrom(structureType)).toBe(true);
    expect(collectionType.canCoerceFrom(scalarType)).toBe(false);
    expect(collectionType.canCoerceFrom(booleanType)).toBe(false);
    expect(collectionType.canCoerceFrom(stringType)).toBe(false);
    expect(collectionType.canCoerceFrom(listType)).toBe(true);
    expect(collectionType.canCoerceFrom(userListType)).toBe(true);

    expect(listType.canCoerceFrom(structureType)).toBe(true);
    expect(listType.canCoerceFrom(scalarType)).toBe(false);
    expect(listType.canCoerceFrom(booleanType)).toBe(false);
    expect(listType.canCoerceFrom(stringType)).toBe(false);
    expect(listType.canCoerceFrom(collectionType)).toBe(false);
    expect(listType.canCoerceFrom(userListType)).toBe(true);

    expect(userListType.canCoerceFrom(structureType)).toBe(true);
    expect(userListType.canCoerceFrom(scalarType)).toBe(false);
    expect(userListType.canCoerceFrom(booleanType)).toBe(false);
    expect(userListType.canCoerceFrom(stringType)).toBe(false);
    expect(userListType.canCoerceFrom(collectionType)).toBe(false);
    expect(userListType.canCoerceFrom(listType)).toBe(false);
  });

  test('Super', () => {
    const example = new Type(
      'example',
      { get: true, set: true },
      new Map(),
      TypeKind.basic,
    );

    example.addSuffixes(noMap(createSuffixType('suffix1', stringType)));

    expect(example.super()).toBeUndefined();
    expect(example.suffixes().get('suffix1')).toBeDefined();
    expect(example.suffixes().get('suffix2')).toBeUndefined();

    const superExample = new Type(
      'superExample',
      { get: true, set: true },
      new Map(),
      TypeKind.basic,
    );

    superExample.addSuffixes(noMap(createSuffixType('suffix2', stringType)));
    example.addSuper(noMap(superExample));

    expect(example.super()).toBeDefined();
    expect(example.suffixes().get('suffix1')).toBeDefined();
    expect(example.suffixes().get('suffix2')).toBeDefined();

    expect(() => example.addSuper(noMap(superExample))).toThrow();
  });
});

describe('Parametric Type', () => {
  test('Basic Attributes', () => {
    const parametricType = new ParametricType(
      'example',
      { get: true, set: true },
      ['T'],
      TypeKind.basic,
    );

    expect(parametricType.kind).toBe(TypeKind.basic);
    expect(parametricType.name).toBe('example');
    expect(parametricType.access.get).toBe(true);
    expect(parametricType.access.set).toBe(true);
    expect(parametricType.callSignature()).toBeUndefined();
    expect(parametricType.anyType).toBe(false);
    expect(parametricType.super()).toBeUndefined();
    expect(parametricType.indexer()).toBeUndefined();
    expect(parametricType.toString()).toBe('example<T>');

    const genericTypeParameters = parametricType.getTypeParameters();
    expect(genericTypeParameters).toHaveLength(1);
    expect(genericTypeParameters[0].name).toBe('T');

    const exampleType = parametricType.apply(stringType);
    const parameters = exampleType.getTypeParameters();

    expect(exampleType.kind).toBe(TypeKind.basic);
    expect(exampleType.name).toBe('example');
    expect(exampleType.access.get).toBe(true);
    expect(exampleType.access.set).toBe(true);
    expect(exampleType.callSignature()).toBeUndefined();
    expect(exampleType.assignmentType()).toBe(exampleType);
    expect(parameters[0].name).toBe('T');
    expect(exampleType.anyType).toBe(false);
    expect(exampleType.super()).toBeUndefined();
    expect(exampleType.indexer()).toBeUndefined();
    expect(exampleType.toString()).toBe('example<string>');

    const typeParameters = exampleType.getTypeParameters();
    expect(typeParameters).toHaveLength(1);
    expect(typeParameters[0].name).toBe('T');
  });

  test('Super', () => {
    const example = new ParametricType(
      'example',
      { get: true, set: true },
      ['T'],
      TypeKind.basic,
    );

    example.addSuffixes(noMap(createSuffixType('suffix1', stringType)));

    expect(example.super()).toBeUndefined();
    expect(example.suffixes().get('suffix1')).toBeDefined();
    expect(example.suffixes().get('suffix2')).toBeUndefined();

    const superExample = new ParametricType(
      'superExample',
      { get: true, set: true },
      ['T'],
      TypeKind.basic,
    );

    superExample.addSuffixes(noMap(createSuffixType('suffix2', stringType)));
    example.addSuper(mapTypes(example, superExample));

    expect(example.super()).toBeDefined();
    expect(example.suffixes().get('suffix1')).toBeDefined();
    expect(example.suffixes().get('suffix2')).toBeDefined();

    expect(() => example.addSuper(noMap(superExample))).toThrow();
  });
});

describe('Union Type', () => {
  test('Basic Attributes', () => {
    const unionType = new UnionType(false, stringType, partType);

    expect(unionType.kind).toBe(TypeKind.basic);
    expect(unionType.name).toBe('Union');
    expect(unionType.access.get).toBe(true);
    expect(unionType.access.set).toBe(true);
    expect(unionType.callSignature()).toBeUndefined();
    expect(unionType.anyType).toBe(false);
    expect(unionType.super()).toBeUndefined();
    expect(unionType.indexer()).toBeUndefined();

    expect(unionType.toString()).toBe('part or string');
    expect(new UnionType(true, stringType, noneType).toString()).toBe(
      'string?',
    );

    const exampleType = unionType.apply(stringType);
    expect(exampleType).toBe(unionType);
  });

  test('Invalid constructors', () => {
    expect(() => new UnionType(false, stringType)).toThrow();
    expect(
      () =>
        new UnionType(
          false,
          stringType,
          stringType.suffixes().get('contains')!,
        ),
    );
  });

  test('SubType', () => {
    const base1 = createType('base1');
    const base2 = createType('base2');
    const sub1 = createType('sub1');
    const sub2 = createType('sub2');

    sub1.addSuper(noMap(base1));
    sub2.addSuper(noMap(base2));

    const unionBase = createUnion(false, base1, base2);
    const unionMix1 = createUnion(false, base1, sub2);
    const unionMix2 = createUnion(false, base2, sub1);
    const unionSub = createUnion(false, sub1, sub2);

    expect(unionSub.isSubtypeOf(unionBase)).toBe(true);
    expect(unionSub.isSubtypeOf(unionMix1)).toBe(true);
    expect(unionSub.isSubtypeOf(unionMix2)).toBe(true);
    expect(unionSub.isSubtypeOf(unionSub)).toBe(true);

    expect(unionMix2.isSubtypeOf(unionBase)).toBe(true);
    expect(unionMix2.isSubtypeOf(unionMix1)).toBe(false);
    expect(unionMix2.isSubtypeOf(unionMix2)).toBe(true);
    expect(unionMix2.isSubtypeOf(unionSub)).toBe(false);

    expect(unionMix1.isSubtypeOf(unionBase)).toBe(true);
    expect(unionMix1.isSubtypeOf(unionMix1)).toBe(true);
    expect(unionMix1.isSubtypeOf(unionMix2)).toBe(false);
    expect(unionMix1.isSubtypeOf(unionSub)).toBe(false);

    expect(unionBase.isSubtypeOf(unionBase)).toBe(true);
    expect(unionBase.isSubtypeOf(unionMix1)).toBe(false);
    expect(unionBase.isSubtypeOf(unionMix2)).toBe(false);
    expect(unionBase.isSubtypeOf(unionSub)).toBe(false);
  });

  test('Has Suffix', () => {
    const unionType = new UnionType(false, stringType, partType);
    const unionSuffixes = unionType.suffixes();

    for (const [name, suffix] of structureType.suffixes()) {
      expect(unionSuffixes.get(name)).toBe(suffix);
    }

    expect(unionSuffixes.size).toBe(structureType.suffixes().size);
  });
});

describe('Delegate Type', () => {
  const testFunction = new Type(
    'test',
    { get: true, set: true },
    new Map(),
    TypeKind.function,
    new CallSignature([scalarType], stringType),
  );

  test('Basic Attributes', () => {
    const delegate = new DelegateType(testFunction);

    expect(delegate.kind).toBe(TypeKind.delegate);
    expect(delegate.name).toBe('delegate');
    expect(delegate.access.get).toBe(true);
    expect(delegate.access.set).toBe(true);
    expect(delegate.callSignature()).toBeDefined();
    expect(delegate.callSignature()).toBe(testFunction.callSignature());
    expect(delegate.anyType).toBe(false);
    expect(delegate.super()).toBe(delegateType);
    expect(delegate.indexer()).toBeUndefined();

    expect(delegate.toString()).toBe(testFunction.toString());

    const exampleType = delegate.apply(stringType);
    expect(exampleType).toBe(delegate);
  });

  test('Invalid constructors', () => {
    expect(() => new DelegateType(stringType)).toThrow();
  });

  test('Has Suffix', () => {
    const delegate = new DelegateType(testFunction);
    const delegateSuffixes = delegate.suffixes();

    for (const [name, suffix] of delegateType.suffixes()) {
      expect(delegateSuffixes.get(name)).toBe(suffix);
    }

    expect(delegateSuffixes.size).toBe(delegateType.suffixes().size);
  });
});
