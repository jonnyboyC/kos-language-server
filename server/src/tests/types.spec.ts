import { stringType } from '../typeChecker/ksTypes/primitives/string';
import { booleanType } from '../typeChecker/ksTypes/primitives/boolean';
import { structureType } from '../typeChecker/ksTypes/primitives/structure';
import { partType } from '../typeChecker/ksTypes/parts/part';
import { dockingPortType } from '../typeChecker/ksTypes/parts/dockingPort';
import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
  noMap,
} from '../typeChecker/typeCreators';
import { typeInitializer } from '../typeChecker/initialize';
import { userListType } from '../typeChecker/ksTypes/collections/userList';
import { listType } from '../typeChecker/ksTypes/collections/list';
import { collectionType } from '../typeChecker/ksTypes/collections/enumerable';
import { scalarType } from '../typeChecker/ksTypes/primitives/scalar';
import { TypeKind } from '../typeChecker/types';
import { ParametricType } from '../typeChecker/parametricTypes/parametricType';
import { Type } from '../typeChecker/types/type';

typeInitializer();

describe('Type Utilities', () => {
  test('Basic Attributes', () => {
    const genericExampleType = new ParametricType(
      'example',
      { get: true, set: true },
      ['T'],
      TypeKind.basic,
    );

    expect(genericExampleType.name).toBe('example');
    expect(genericExampleType.access.get).toBe(true);
    expect(genericExampleType.access.set).toBe(true);
    expect(genericExampleType.getCallSignature()).toBeUndefined();
    expect(genericExampleType.anyType).toBe(false);
    expect(genericExampleType.getSuperType()).toBeUndefined();

    const genericTypeParameters = genericExampleType.getTypeParameters();
    expect(genericTypeParameters.length).toBe(1);
    expect(genericTypeParameters[0].name).toBe('T');

    const exampleType = genericExampleType.apply(stringType);
    const parameters = exampleType.getTypeParameters();

    expect(exampleType.name).toBe('example');
    expect(exampleType.access.get).toBe(true);
    expect(exampleType.access.set).toBe(true);
    expect(exampleType.getCallSignature()).toBeUndefined();
    expect(exampleType.getAssignmentType()).toBe(exampleType);
    expect(parameters[0].name).toBe('T');
    expect(exampleType.anyType).toBe(false);
    expect(exampleType.getSuperType()).toBeUndefined();

    const typeParameters = exampleType.getTypeParameters();
    expect(typeParameters.length).toBe(1);
    expect(typeParameters[0].name).toBe('T');
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
    const aType = createStructureType('a');
    const bType = createStructureType('b');
    const cType = createStructureType('c');

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
    const aType = createStructureType('a');
    const bType = createStructureType('b');
    const cType = createStructureType('c');
    const dType = createStructureType('d');

    aType.addSuffixes(
      noMap(createSuffixType('example1', cType)),
      noMap(createSuffixType('example2', cType)),
    );

    bType.addSuffixes(noMap(createSuffixType('example3', cType)));

    bType.addSuper(noMap(aType));

    cType.addSuffixes(noMap(createArgSuffixType('example', dType, dType)));

    expect(aType.getSuffixes().get('example1')).toBeDefined();
    expect(aType.getSuffixes().get('example2')).toBeDefined();
    expect(aType.getSuffixes().get('example3')).toBeUndefined();

    expect(bType.getSuffixes().get('example1')).toBeDefined();
    expect(bType.getSuffixes().get('example2')).toBeDefined();
    expect(bType.getSuffixes().get('example3')).toBeDefined();
    expect(bType.getSuffixes().get('other')).toBeUndefined();

    expect(cType.getSuffixes().get('example')).toBeDefined();
    expect(cType.getSuffixes().get('other')).toBeUndefined();

    expect(dType.getSuffixes().get('any')).toBeUndefined();
  });

  test('Can Coerce', () => {
    expect(structureType.canCoerceFrom(scalarType)).toBe(true);
    expect(structureType.canCoerceFrom(booleanType)).toBe(true);
    expect(structureType.canCoerceFrom(stringType)).toBe(true);
    expect(structureType.canCoerceFrom(collectionType)).toBe(true);
    expect(structureType.canCoerceFrom(listType)).toBe(true);
    expect(structureType.canCoerceFrom(userListType)).toBe(true);

    expect(scalarType.canCoerceFrom(structureType)).toBe(true);
    expect(scalarType.canCoerceFrom(booleanType)).toBe(true);
    expect(scalarType.canCoerceFrom(stringType)).toBe(true);
    expect(scalarType.canCoerceFrom(collectionType)).toBe(false);
    expect(scalarType.canCoerceFrom(listType)).toBe(false);
    expect(scalarType.canCoerceFrom(userListType)).toBe(false);

    expect(booleanType.canCoerceFrom(structureType)).toBe(true);
    expect(booleanType.canCoerceFrom(scalarType)).toBe(true);
    expect(booleanType.canCoerceFrom(stringType)).toBe(true);
    expect(booleanType.canCoerceFrom(collectionType)).toBe(false);
    expect(booleanType.canCoerceFrom(listType)).toBe(false);
    expect(booleanType.canCoerceFrom(userListType)).toBe(false);

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

    expect(example.getSuperType()).toBeUndefined();
    expect(example.getSuffixes().get('suffix1')).toBeDefined();
    expect(example.getSuffixes().get('suffix2')).toBeUndefined();

    const superExample = new Type(
      'superExample',
      { get: true, set: true },
      new Map(),
      TypeKind.basic,
    );

    superExample.addSuffixes(noMap(createSuffixType('suffix2', stringType)));
    example.addSuper(noMap(superExample));

    expect(example.getSuperType()).toBeDefined();
    expect(example.getSuffixes().get('suffix1')).toBeDefined();
    expect(example.getSuffixes().get('suffix2')).toBeDefined();
  });
});
