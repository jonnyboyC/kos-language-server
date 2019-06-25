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
  rangeContainsPos,
  rangeIntersection,
  rangeBefore,
  rangeAfter,
  rangeToString,
  binaryLeft,
  binaryRight,
  binaryLeftKey,
  binaryRightKey,
} from '../utilities/positionUtils';
import { toCase } from '../utilities/stringUtils';
import { Logger } from '../utilities/logger';
import { URI } from 'vscode-uri';

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
      uri: 'file:///root/example/otherFile.ks',
    };

    const otherDirLocation: Location = {
      range,
      uri: 'file:///root/example/up/upFile.ks',
    };

    const relative1 = ['relative', 'path', 'file.ks'].join('/');
    const relative2 = ['..', 'relative', 'path', 'file.ks'].join('/');
    const absolute = ['0:', 'relative', 'path', 'file.ks'].join('/');
    const weird = ['0:relative', 'path', 'file.ks'].join('/');

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

    pathResolver.volume0Uri = URI.file(join('root', 'example'));

    const resolvedUri = 'file:///root/example/relative/path/file.ks';

    const relativeResolved1 = pathResolver.resolveUri(
      otherFileLocation,
      relative1,
    );
    expect(undefined).not.toBe(relativeResolved1);
    if (!empty(relativeResolved1)) {
      expect(relativeResolved1.uri.toString()).toBe(resolvedUri);
      expect(rangeEqual(range, relativeResolved1.caller)).toBe(true);
    }

    const relativeResolved2 = pathResolver.resolveUri(
      otherDirLocation,
      relative2,
    );
    expect(undefined).not.toBe(relativeResolved2);
    if (!empty(relativeResolved2)) {
      expect(relativeResolved2.uri.toString()).toBe(resolvedUri);
      expect(rangeEqual(range, relativeResolved2.caller)).toBe(true);
    }

    const absoluteResolved = pathResolver.resolveUri(
      otherFileLocation,
      absolute,
    );
    expect(undefined).not.toBe(absoluteResolved);
    if (!empty(absoluteResolved)) {
      expect(absoluteResolved.uri.toString()).toBe(resolvedUri);
      expect(rangeEqual(range, absoluteResolved.caller)).toBe(true);
    }

    const weirdResolved = pathResolver.resolveUri(otherFileLocation, weird);
    expect(undefined).not.toBe(weirdResolved);
    if (!empty(weirdResolved)) {
      expect(weirdResolved.uri.toString()).toBe(resolvedUri);
      expect(rangeEqual(range, weirdResolved.caller)).toBe(true);
    }
  });
});

const createRange = (
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
): Range => {
  return {
    start: Position.create(startLine, startCharacter),
    end: Position.create(endLine, endCharacter),
  };
};

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

    expect(rangeContainsPos(range1, rangeWithin.start)).toBeTruthy();
    expect(rangeContainsPos(range1, rangeWithin.end)).toBeTruthy();

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

  test('binary search utils', () => {
    const ranges: Range[] = [
      createRange(0, 0, 0, 5),
      createRange(0, 6, 0, 10),
      createRange(0, 11, 0, 15),
      createRange(0, 21, 0, 25),
      createRange(0, 26, 0, 30),
      createRange(0, 31, 0, 35),
    ];

    const unity = <T>(x: T) => x;

    const result11 = binaryLeft(ranges, Position.create(0, 1));
    const result12 = binaryLeftKey(ranges, Position.create(0, 1), unity);
    expect(result11).toBe(ranges[0]);
    expect(result12).toBe(ranges[0]);

    const result21 = binaryLeft(ranges, Position.create(0, 17));
    const result22 = binaryLeftKey(ranges, Position.create(0, 17), unity);
    expect(result21).toBe(ranges[2]);
    expect(result22).toBe(ranges[2]);

    const result31 = binaryLeft(ranges, Position.create(0, 26));
    const result32 = binaryLeftKey(ranges, Position.create(0, 26), unity);
    expect(result31).toBe(ranges[4]);
    expect(result32).toBe(ranges[4]);

    const result41 = binaryRight(ranges, Position.create(0, 1));
    const result42 = binaryRightKey(ranges, Position.create(0, 1), unity);
    expect(result41).toBe(ranges[0]);
    expect(result42).toBe(ranges[0]);

    const result51 = binaryRight(ranges, Position.create(0, 17));
    const result52 = binaryRightKey(ranges, Position.create(0, 17), unity);
    expect(result51).toBe(ranges[3]);
    expect(result52).toBe(ranges[3]);

    const result61 = binaryRight(ranges, Position.create(0, 26));
    const result62 = binaryRightKey(ranges, Position.create(0, 26), unity);
    expect(result61).toBe(ranges[4]);
    expect(result62).toBe(ranges[4]);
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

    expect(toCase(CaseKind.lowercase, 'EXAMPLE', 'example')).toBe(
      'exampleexample',
    );
    expect(toCase(CaseKind.uppercase, 'EXAMPLE', 'example')).toBe(
      'EXAMPLEEXAMPLE',
    );
    expect(toCase(CaseKind.pascalcase, 'EXAMPLE', 'example')).toBe(
      'ExampleExample',
    );
    expect(toCase(CaseKind.camelcase, 'EXAMPLE', 'example')).toBe(
      'exampleExample',
    );
  });
});

describe('logger', () => {
  test('log level', () => {
    const mockBase = {
      lastLevel: LogLevel.verbose,
      lastMessage: '',
      log(message: string) {
        mockBase.lastLevel = LogLevel.log;
        mockBase.lastMessage = message;
      },
      info(message: string) {
        mockBase.lastLevel = LogLevel.info;
        mockBase.lastMessage = message;
      },
      warn(message: string) {
        mockBase.lastLevel = LogLevel.warn;
        mockBase.lastMessage = message;
      },
      error(message: string) {
        mockBase.lastLevel = LogLevel.error;
        mockBase.lastMessage = message;
      },
    };

    const logger = new Logger(mockBase, LogLevel.info);

    expect(logger.level).toBe(LogLevel.info);

    logger.info('info');
    expect(mockBase.lastLevel).toBe(LogLevel.info);
    expect(mockBase.lastMessage).toBe('info');

    logger.log('log');
    expect(mockBase.lastLevel).toBe(LogLevel.log);
    expect(mockBase.lastMessage).toBe('log');

    logger.warn('warn');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('warn');

    // TODO this is a temporary thing until we get the
    // errors in the type checker under control
    logger.error('error');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');

    // set logging off
    logger.level = LogLevel.none;
    logger.info('info');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');

    logger.log('log');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');

    logger.warn('warn');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');

    logger.error('error');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');
  });
});

// describe('tree traverse', () => {
//   test('token check', () => {
//     const source = readFileSync('../../kerboscripts/unitTests/allLanguage.ks', 'utf-8');
//     const scanner = new Scanner(source, 'file://fake.ks');
//     const { tokens } = scanner.scanTokens();

//     const parser = new Parser('file:://fake.ks', tokens);
//     const { script } = parser.parse();

//     const tokenCheck = new TokenCheck();
//     tokenCheck.orderedTokens(script);

//     for (const statement of validStatements) {
//     }
//   });
// });
