import { isCorrectCallType } from '../typeChecker/typeUtilities';
import { stringType } from '../typeChecker/types/primitives/string';
import { booleanType } from '../typeChecker/types/primitives/boolean';
import { structureType } from '../typeChecker/types/primitives/structure';
import { partType } from '../typeChecker/types/parts/part';
import { dockingPortType } from '../typeChecker/types/parts/dockingPort';
import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
} from '../typeChecker/typeCreators';
import { CallKind } from '../typeChecker/types';
import { typeInitializer } from '../typeChecker/initialize';

typeInitializer();

describe('Type Utilities', () => {
  test('Call type', () => {
    expect(isCorrectCallType(CallKind.call, CallKind.call)).toBe(true);
    expect(isCorrectCallType(CallKind.call, CallKind.get)).toBe(false);
    expect(isCorrectCallType(CallKind.call, CallKind.set)).toBe(false);
    expect(isCorrectCallType(CallKind.call, CallKind.optionalCall)).toBe(false);

    expect(isCorrectCallType(CallKind.get, CallKind.call)).toBe(false);
    expect(isCorrectCallType(CallKind.get, CallKind.get)).toBe(true);
    expect(isCorrectCallType(CallKind.get, CallKind.set)).toBe(false);
    expect(isCorrectCallType(CallKind.get, CallKind.optionalCall)).toBe(false);

    expect(isCorrectCallType(CallKind.set, CallKind.call)).toBe(false);
    expect(isCorrectCallType(CallKind.set, CallKind.get)).toBe(false);
    expect(isCorrectCallType(CallKind.set, CallKind.set)).toBe(true);
    expect(isCorrectCallType(CallKind.set, CallKind.optionalCall)).toBe(false);

    expect(isCorrectCallType(CallKind.optionalCall, CallKind.call)).toBe(true);
    expect(isCorrectCallType(CallKind.optionalCall, CallKind.get)).toBe(true);
    expect(isCorrectCallType(CallKind.optionalCall, CallKind.set)).toBe(false);
    expect(
      isCorrectCallType(CallKind.optionalCall, CallKind.optionalCall),
    ).toBe(true);
  });

  test('Is Subtype 1', () => {
    expect(stringType.isSubtypeOf(stringType)).toBe(true);
    expect(booleanType.isSubtypeOf(stringType)).toBe(false);
    expect(structureType.isSubtypeOf(stringType)).toBe(true);
    expect(partType.isSubtypeOf(stringType)).toBe(false);
    expect(dockingPortType.isSubtypeOf(stringType)).toBe(false);

    expect(stringType.isSubtypeOf(booleanType)).toBe(false);
    expect(booleanType.isSubtypeOf(booleanType)).toBe(true);
    expect(structureType.isSubtypeOf(booleanType)).toBe(true);
    expect(partType.isSubtypeOf(booleanType)).toBe(false);
    expect(dockingPortType.isSubtypeOf(booleanType)).toBe(false);

    expect(stringType.isSubtypeOf(structureType)).toBe(false);
    expect(booleanType.isSubtypeOf(structureType)).toBe(false);
    expect(structureType.isSubtypeOf(structureType)).toBe(true);
    expect(partType.isSubtypeOf(structureType)).toBe(false);
    expect(dockingPortType.isSubtypeOf(structureType)).toBe(false);

    expect(stringType.isSubtypeOf(partType)).toBe(false);
    expect(booleanType.isSubtypeOf(partType)).toBe(false);
    expect(structureType.isSubtypeOf(partType)).toBe(true);
    expect(partType.isSubtypeOf(partType)).toBe(true);
    expect(dockingPortType.isSubtypeOf(partType)).toBe(false);

    expect(stringType.isSubtypeOf(dockingPortType)).toBe(false);
    expect(booleanType.isSubtypeOf(dockingPortType)).toBe(false);
    expect(structureType.isSubtypeOf(dockingPortType)).toBe(true);
    expect(partType.isSubtypeOf(dockingPortType)).toBe(true);
    expect(dockingPortType.isSubtypeOf(dockingPortType)).toBe(true);
  });

  test('Is Subtype 2', () => {
    const aType = createStructureType('a');
    const bType = createStructureType('b');
    const cType = createStructureType('c');

    bType.addSuper(aType);
    cType.addSuper(aType);

    expect(aType.isSubtypeOf(bType)).toBe(true);
    expect(aType.isSubtypeOf(cType)).toBe(true);

    expect(bType.isSubtypeOf(aType)).toBe(false);
    expect(bType.isSubtypeOf(cType)).toBe(false);

    expect(cType.isSubtypeOf(bType)).toBe(false);
    expect(cType.isSubtypeOf(aType)).toBe(false);
  });

  test('Has Suffix', () => {
    const aType = createStructureType('a');
    const bType = createStructureType('b');
    const cType = createStructureType('c');
    const dType = createStructureType('d');

    aType.addSuffixes(
      createSuffixType('example1', cType),
      createSuffixType('example2', cType),
    );

    bType.addSuffixes(createSuffixType('example3', cType));

    bType.addSuper(aType);

    cType.addSuffixes(createArgSuffixType('example', dType, dType));

    expect(aType.getSuffix('example1')).toBeDefined();
    expect(aType.getSuffix('example2')).toBeDefined();
    expect(aType.getSuffix('example3')).toBeUndefined();

    expect(bType.getSuffix('example1')).toBeDefined();
    expect(bType.getSuffix('example2')).toBeDefined();
    expect(bType.getSuffix('example3')).toBeDefined();
    expect(bType.getSuffix('other')).toBeUndefined();

    expect(cType.getSuffix('example')).toBeDefined();
    expect(cType.getSuffix('other')).toBeUndefined();

    expect(dType.getSuffix('any')).toBeUndefined();
  });
});
