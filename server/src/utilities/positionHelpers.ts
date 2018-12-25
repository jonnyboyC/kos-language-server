import { Position, Range } from 'vscode-languageserver';

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
