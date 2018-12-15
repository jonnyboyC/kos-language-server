import { Position } from "vscode-languageserver";

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
}

export const positionAfterEqual = (pos1: Position, pos2: Position): boolean => {
  return positionAfter(pos1, pos2)
    || positionEqual(pos1, pos2);
}

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
}

export const positionBeforeEqual = (pos1: Position, pos2: Position): boolean => {
  return positionBefore(pos1, pos2)
    || positionEqual(pos1, pos2);
}

export const positionEqual = (pos1: Position, pos2: Position): boolean => {
  return pos1.line === pos2.line
    && pos1.character == pos2.character;
}