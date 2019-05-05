import { Location, Position, Range } from 'vscode-languageserver';
import { join } from 'path';
import { PathResolver } from '../utilities/pathResolver';
import { empty } from '../utilities/typeGuards';
import {
  rangeEqual,
  positionAfter,
  positionBefore,
  positionEqual,
  positionAfterEqual,
  positionBeforeEqual,
  positionToString,
  rangeContains,
  rangeIntersection,
  rangeBefore,
  rangeAfter,
  rangeToString,
} from '../utilities/positionUtils';
import { toCase } from '../utilities/stringUtils';

describe('path resolver', () => {
  test('path resolver', () => {
    const pathResolver = new PathResolver();
    const range = {
      start: {
        line: 0,
        character: 0,
      },
      end: {
        line: 0,
        character: 1,
      },
    };

    const otherFileLocation: Location = {
      range,
      uri: 'file://example/otherFile.ks',
    };

    const otherDirLocation: Location = {
      range,
      uri: 'file://example/up/upFile.ks',
    };

    const relative1 = join('relative', 'path', 'file.ks');
    const relative2 = join('..', 'relative', 'path', 'file.ks');
    const absolute = join('0:', 'relative', 'path', 'file.ks');
    const weird = join('0:relative', 'path', 'file.ks');

    expect(
      pathResolver.resolveUri(otherFileLocation, relative1),
    ).toBeUndefined();
    expect(
      pathResolver.resolveUri(otherDirLocation, relative2),
    ).toBeUndefined();
    expect(
      pathResolver.resolveUri(otherFileLocation, absolute),
    ).toBeUndefined();
    expect(pathResolver.resolveUri(otherFileLocation, weird)).toBeUndefined();

    pathResolver.volume0Path = join('root', 'example');
    pathResolver.volume0Uri = 'file://example';

    const resolvedPath = join('root', 'example', 'relative', 'path', 'file.ks');
    const resolvedUri = 'file://example/relative/path/file.ks';

    const relativeResolved1 = pathResolver.resolveUri(
      otherFileLocation,
      relative1,
    );
    expect(undefined).not.toBe(relativeResolved1);
    if (!empty(relativeResolved1)) {
      expect(resolvedPath).toBe(relativeResolved1.path);
      expect(resolvedUri).toBe(relativeResolved1.uri);
      expect(rangeEqual(range, relativeResolved1.caller)).toBe(true);
    }

    const relativeResolved2 = pathResolver.resolveUri(
      otherDirLocation,
      relative2,
    );
    expect(undefined).not.toBe(relativeResolved2);
    if (!empty(relativeResolved2)) {
      expect(resolvedPath).toBe(relativeResolved2.path);
      expect(resolvedUri).toBe(relativeResolved2.uri);
      expect(rangeEqual(range, relativeResolved2.caller)).toBe(true);
    }

    const absoluteResolved = pathResolver.resolveUri(
      otherFileLocation,
      absolute,
    );
    expect(undefined).not.toBe(absoluteResolved);
    if (!empty(absoluteResolved)) {
      expect(resolvedPath).toBe(absoluteResolved.path);
      expect(resolvedUri).toBe(absoluteResolved.uri);
      expect(rangeEqual(range, absoluteResolved.caller)).toBe(true);
    }

    const weirdResolved = pathResolver.resolveUri(otherFileLocation, weird);
    expect(undefined).not.toBe(weirdResolved);
    if (!empty(weirdResolved)) {
      expect(resolvedPath).toBe(weirdResolved.path);
      expect(resolvedUri).toBe(weirdResolved.uri);
      expect(rangeEqual(range, weirdResolved.caller)).toBe(true);
    }
  });
});

describe('position utils', () => {
  test('position utils', () => {
    const pos1: Position = {
      line: 5,
      character: 10,
    };

    const pos2: Position = {
      line: 5,
      character: 11,
    };

    const pos3: Position = {
      line: 4,
      character: 2,
    };

    const pos4: Position = {
      line: 4,
      character: 8,
    };

    // pos 1
    expect(positionEqual(pos1, pos1)).toBeTruthy();
    expect(positionAfterEqual(pos1, pos1)).toBeTruthy();
    expect(positionBeforeEqual(pos1, pos1)).toBeTruthy();
    expect(positionBefore(pos1, pos2)).toBeTruthy();
    expect(positionBeforeEqual(pos1, pos2)).toBeTruthy();
    expect(positionAfter(pos1, pos3)).toBeTruthy();
    expect(positionAfterEqual(pos1, pos3)).toBeTruthy();
    expect(positionAfter(pos1, pos4)).toBeTruthy();
    expect(positionAfterEqual(pos1, pos4)).toBeTruthy();

    // pos 2
    expect(positionEqual(pos2, pos2)).toBeTruthy();
    expect(positionAfterEqual(pos2, pos2)).toBeTruthy();
    expect(positionBeforeEqual(pos2, pos2)).toBeTruthy();
    expect(positionAfter(pos2, pos1)).toBeTruthy();
    expect(positionAfter(pos2, pos3)).toBeTruthy();
    expect(positionAfter(pos2, pos4)).toBeTruthy();

    // pos 3
    expect(positionEqual(pos3, pos3)).toBeTruthy();
    expect(positionAfterEqual(pos3, pos3)).toBeTruthy();
    expect(positionBeforeEqual(pos3, pos3)).toBeTruthy();
    expect(positionBefore(pos3, pos1)).toBeTruthy();
    expect(positionBefore(pos3, pos2)).toBeTruthy();
    expect(positionBefore(pos3, pos4)).toBeTruthy();

    // pos 4
    expect(positionEqual(pos4, pos4)).toBeTruthy();
    expect(positionAfterEqual(pos4, pos4)).toBeTruthy();
    expect(positionBeforeEqual(pos4, pos4)).toBeTruthy();
    expect(positionBefore(pos4, pos1)).toBeTruthy();
    expect(positionBefore(pos4, pos2)).toBeTruthy();
    expect(positionAfter(pos4, pos3)).toBeTruthy();

    expect(positionToString(pos1)).toBe('line: 6 character: 11');
  });

  test('ranger utils', () => {
    const range1: Range = {
      start: {
        line: 4,
        character: 2,
      },
      end: {
        line: 5,
        character: 18,
      },
    };

    const rangeWithin: Range = {
      start: {
        line: 5,
        character: 4,
      },
      end: {
        line: 5,
        character: 16,
      },
    };

    const rangeIntersect: Range = {
      start: {
        line: 4,
        character: 1,
      },
      end: {
        line: 4,
        character: 14,
      },
    };

    const rangeOther: Range = {
      start: {
        line: 4,
        character: 1,
      },
      end: {
        line: 4,
        character: 1,
      },
    };

    // pos 1
    expect(rangeEqual(range1, range1)).toBeTruthy();
    expect(rangeEqual(rangeWithin, rangeWithin)).toBeTruthy();
    expect(rangeEqual(rangeIntersect, rangeIntersect)).toBeTruthy();

    expect(rangeContains(range1, rangeWithin.start)).toBeTruthy();
    expect(rangeContains(range1, rangeWithin.end)).toBeTruthy();

    expect(rangeIntersection(range1, rangeIntersect)).toBeTruthy();
    expect(rangeIntersection(rangeIntersect, range1)).toBeTruthy();

    expect(rangeAfter(range1, { line: 3, character: 24 })).toBeTruthy();
    expect(rangeAfter(range1, { line: 4, character: 1 })).toBeTruthy();

    expect(rangeBefore(range1, { line: 5, character: 20 })).toBeTruthy();
    expect(rangeBefore(range1, { line: 6, character: 1 })).toBeTruthy();

    expect(rangeToString(range1)).toBe(
      'line: 5 character: 3 to line: 6 character: 19',
    );
    expect(rangeToString(rangeWithin)).toBe('line: 6 character: 5-17');
    expect(rangeToString(rangeIntersect)).toBe('line: 5 character: 2-15');
    expect(rangeToString(rangeOther)).toBe('line: 5 character: 2');
  });
});

describe('to case', () => {
  test('case changes', () => {
    expect(toCase(CaseKind.lowercase, 'example')).toBe('example');
    expect(toCase(CaseKind.uppercase, 'example')).toBe('EXAMPLE');
    expect(toCase(CaseKind.pascalcase, 'example')).toBe('Example');
    expect(toCase(CaseKind.camelcase, 'example')).toBe('example');

    expect(toCase(CaseKind.lowercase, 'EXAMPLE')).toBe('example');
    expect(toCase(CaseKind.uppercase, 'EXAMPLE')).toBe('EXAMPLE');
    expect(toCase(CaseKind.pascalcase, 'EXAMPLE')).toBe('Example');
    expect(toCase(CaseKind.camelcase, 'EXAMPLE')).toBe('example');

    expect(toCase(CaseKind.lowercase, 'EXAMPLE', 'example')).toBe('exampleexample');
    expect(toCase(CaseKind.uppercase, 'EXAMPLE', 'example')).toBe('EXAMPLEEXAMPLE');
    expect(toCase(CaseKind.pascalcase, 'EXAMPLE', 'example')).toBe('ExampleExample');
    expect(toCase(CaseKind.camelcase, 'EXAMPLE', 'example')).toBe('exampleExample');
  });
});
