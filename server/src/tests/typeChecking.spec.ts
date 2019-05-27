import {
  isCorrectCallType,
  isSubType,
  addPrototype,
  addSuffixes,
  hasSuffix,
} from '../typeChecker/typeUitlities';
import { CallType } from '../typeChecker/types/types';
import { stringType } from '../typeChecker/types/primitives/string';
import { booleanType } from '../typeChecker/types/primitives/boolean';
import { structureType } from '../typeChecker/types/primitives/structure';
import { partType } from '../typeChecker/types/parts/part';
import { dockingPortType } from '../typeChecker/types/parts/dockingPort';
import { primitiveInitializer } from '../typeChecker/types/primitives/initialize';
import { oribitalInitializer } from '../typeChecker/types/orbital/initialize';
import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
} from '../typeChecker/typeCreators';

primitiveInitializer();
oribitalInitializer();

describe('Type Utilities', () => {
  test('Call type', () => {
    expect(isCorrectCallType(CallType.call, CallType.call)).toBe(true);
    expect(isCorrectCallType(CallType.call, CallType.get)).toBe(false);
    expect(isCorrectCallType(CallType.call, CallType.set)).toBe(false);
    expect(isCorrectCallType(CallType.call, CallType.optionalCall)).toBe(false);

    expect(isCorrectCallType(CallType.get, CallType.call)).toBe(false);
    expect(isCorrectCallType(CallType.get, CallType.get)).toBe(true);
    expect(isCorrectCallType(CallType.get, CallType.set)).toBe(false);
    expect(isCorrectCallType(CallType.get, CallType.optionalCall)).toBe(false);

    expect(isCorrectCallType(CallType.set, CallType.call)).toBe(false);
    expect(isCorrectCallType(CallType.set, CallType.get)).toBe(false);
    expect(isCorrectCallType(CallType.set, CallType.set)).toBe(true);
    expect(isCorrectCallType(CallType.set, CallType.optionalCall)).toBe(false);

    expect(isCorrectCallType(CallType.optionalCall, CallType.call)).toBe(true);
    expect(isCorrectCallType(CallType.optionalCall, CallType.get)).toBe(true);
    expect(isCorrectCallType(CallType.optionalCall, CallType.set)).toBe(false);
    expect(
      isCorrectCallType(CallType.optionalCall, CallType.optionalCall),
    ).toBe(true);
  });

  test('Is Subtype 1', () => {
    expect(isSubType(stringType, stringType)).toBe(true);
    expect(isSubType(stringType, booleanType)).toBe(false);
    expect(isSubType(stringType, structureType)).toBe(true);
    expect(isSubType(stringType, partType)).toBe(false);
    expect(isSubType(stringType, dockingPortType)).toBe(false);

    expect(isSubType(booleanType, stringType)).toBe(false);
    expect(isSubType(booleanType, booleanType)).toBe(true);
    expect(isSubType(booleanType, structureType)).toBe(true);
    expect(isSubType(booleanType, partType)).toBe(false);
    expect(isSubType(booleanType, dockingPortType)).toBe(false);

    expect(isSubType(structureType, booleanType)).toBe(false);
    expect(isSubType(structureType, booleanType)).toBe(false);
    expect(isSubType(structureType, structureType)).toBe(true);
    expect(isSubType(structureType, partType)).toBe(false);
    expect(isSubType(structureType, dockingPortType)).toBe(false);

    expect(isSubType(partType, stringType)).toBe(false);
    expect(isSubType(partType, booleanType)).toBe(false);
    expect(isSubType(partType, structureType)).toBe(true);
    expect(isSubType(partType, partType)).toBe(true);
    expect(isSubType(partType, dockingPortType)).toBe(false);

    expect(isSubType(dockingPortType, stringType)).toBe(false);
    expect(isSubType(dockingPortType, booleanType)).toBe(false);
    expect(isSubType(dockingPortType, structureType)).toBe(true);
    expect(isSubType(dockingPortType, partType)).toBe(true);
    expect(isSubType(dockingPortType, dockingPortType)).toBe(true);
  });

  test('Is Subtype 2', () => {
    const aType = createStructureType('a');
    const bType = createStructureType('b');
    const cType = createStructureType('c');

    addPrototype(bType, aType);
    addPrototype(cType, aType);

    expect(isSubType(bType, aType)).toBe(true);
    expect(isSubType(cType, aType)).toBe(true);

    expect(isSubType(aType, bType)).toBe(false);
    expect(isSubType(cType, bType)).toBe(false);

    expect(isSubType(bType, cType)).toBe(false);
    expect(isSubType(aType, cType)).toBe(false);
  });

  test('Has Suffix', () => {
    const aType = createStructureType('a');
    const bType = createStructureType('b');
    const cType = createStructureType('c');
    const dType = createStructureType('d');

    addSuffixes(
      aType,
      createSuffixType('example1', cType),
      createSuffixType('example2', cType),
    );

    addSuffixes(bType, createSuffixType('example3', cType));

    addPrototype(bType, aType);

    addSuffixes(cType, createArgSuffixType('example', dType, dType));

    expect(hasSuffix(aType, 'example1')).toBe(true);
    expect(hasSuffix(aType, 'example2')).toBe(true);
    expect(hasSuffix(aType, 'example3')).toBe(false);

    expect(hasSuffix(bType, 'example1')).toBe(true);
    expect(hasSuffix(bType, 'example2')).toBe(true);
    expect(hasSuffix(bType, 'example3')).toBe(true);
    expect(hasSuffix(bType, 'other')).toBe(false);

    expect(hasSuffix(cType, 'example')).toBe(true);
    expect(hasSuffix(cType, 'other')).toBe(false);

    expect(hasSuffix(dType, 'any')).toBe(false);
  });
});
