import { Position, Range, Location } from 'vscode-languageserver';

export const positionAfter = (pos1: Position, pos2: Position): boolean => {
  if (pos1.line > pos2.line) {
    return true;
  }

  if (pos1.line === pos2.line) {
    if (pos1.character > pos2.character) {
      return true;
    }
  }

  return false;
};

export const positionAfterEqual = (pos1: Position, pos2: Position): boolean => {
  return positionAfter(pos1, pos2)
    || positionEqual(pos1, pos2);
};

export const positionBefore = (pos1: Position, pos2: Position): boolean => {
  if (pos1.line < pos2.line) {
    return true;
  }

  if (pos1.line === pos2.line) {
    if (pos1.character < pos2.character) {
      return true;
    }
  }

  return false;
};

export const positionBeforeEqual = (pos1: Position, pos2: Position): boolean => {
  return positionBefore(pos1, pos2)
    || positionEqual(pos1, pos2);
};

export const positionEqual = (pos1: Position, pos2: Position): boolean => {
  return pos1.line === pos2.line
    && pos1.character === pos2.character;
};

export const rangeEqual = (range1: Range, range2: Range): boolean => {
  if (!positionEqual(range1.start, range2.start)) return false;
  return positionEqual(range1.end, range2.end);
};

export const rangeContains = (range: Range, pos: Position): boolean => {
  if (pos.line < range.start.line) return false;
  if (pos.line === range.start.line && pos.character < range.start.character) return false;
  if (pos.line > range.end.line) return false;
  if (pos.line === range.end.line && pos.character > range.end.character) return false;

  return true;
};

export const rangeBefore = (range: Range, pos: Position): boolean => {
  if (pos.line > range.end.line) return true;
  if (pos.line === range.end.line) {
    if (pos.character > range.end.character) return true;
  }

  return false;
};

export const rangeAfter = (range: Range, pos: Position): boolean => {
  if (pos.line < range.start.line) return true;
  if (pos.line === range.start.line) {
    if (pos.character < range.start.character) return true;
  }

  return false;
};

export const rangeIntersection = (range1: Range, range2: Range): boolean => {
  if (rangeAfter(range1, range2.end)) return false;
  if (rangeBefore(range2, range2.end)) return false;
  return true;
};

export const rangeToString = (range: Range): string => {
  const sameLine = range.start.line === range.end.line;
  const line = sameLine
    ? (range.start.line + 1).toString()
    : `${range.start.line + 1}-${range.end.line + 1}`;

  const sameCharacter = range.start.character === range.end.character;
  const character = sameLine && sameCharacter
    ? (range.start.character + 1).toString()
    : `${range.start.character + 1}-${range.end.character + 1}`;

  return `line: ${line} character: ${character}`;
};

export const binarySearch = <T extends Range>(ranges: T[], pos: Position): Maybe<T> => {
  const index = binarySearchIndex(ranges, pos);
  return Array.isArray(index)
    ? undefined
    : ranges[index];
};

export const binaryRight = <T extends Range>(ranges: T[], pos: Position): Maybe<T> => {
  if (rangeAfter(ranges[0], pos)) {
    return undefined;
  }
  const index = binarySearchIndex(ranges, pos);

  return Array.isArray(index)
    ? ranges[index[1]]
    : ranges[index];
};

export const binaryLeftIndex = <T extends Range>(ranges: T[], pos: Position): Maybe<T> => {
  if (ranges.length === 0 || rangeBefore(ranges[rangeAfter.length - 1], pos)) {
    return undefined;
  }
  const index = binarySearchIndex(ranges, pos);

  return Array.isArray(index)
    ? ranges[index[0]]
    : ranges[index];
};

export const binaryRightKeyIndex = <T>(ranges: T[], pos: Position, key: (range: T) => Range):
  Maybe<T> => {
  if (ranges.length === 0 || rangeAfter(key(ranges[0]), pos)) {
    return undefined;
  }
  const index = binarySearchKeyIndex(ranges, pos, key);

  return Array.isArray(index)
    ? ranges[index[1]]
    : ranges[index];
};

export const binarySearchIndex = <T extends Range>(ranges: T[], pos: Position):
  number | [number, number] => {
  let left = 0;
  let right = ranges.length - 1;

  while (left <= right) {
    const mid = Math.floor((right + left) / 2);
    if (rangeBefore(ranges[mid], pos)) {
      left = mid + 1;
    } else if (rangeAfter(ranges[mid], pos)) {
      right = mid - 1;
    } else if (rangeContains(ranges[mid], pos)) {
      return mid;
    } else {
      return [left, right];
    }
  }

  return [left, right];
};

export const binarySearchKeyIndex = <T>(ranges: T[], pos: Position, key: (range: T) => Range):
  number | [number, number] => {
  let left = 0;
  let right = ranges.length - 1;

  while (left <= right) {
    const mid = Math.floor((right + left) / 2);
    if (rangeBefore(key(ranges[mid]), pos)) {
      left = mid + 1;
    } else if (rangeAfter(key(ranges[mid]), pos)) {
      right = mid - 1;
    } else if (rangeContains(key(ranges[mid]), pos)) {
      return mid;
    } else {
      return [left, right];
    }
  }

  return [left, right];
};

export const locationEqual = (loc1: Location, loc2: Location): boolean => {
  if (loc1.uri !== loc2.uri) return false;
  return rangeEqual(loc1.range, loc2.range);
};

export const locationCopy = (loc: Location): Location => {
  return {
    range: loc.range,
    uri: loc.uri,
  };
};
