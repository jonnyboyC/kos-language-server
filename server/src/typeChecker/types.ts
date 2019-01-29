import { IType } from './types/types';
import { Range } from 'vscode-languageserver';

export interface ITypeError extends Range {
  tag: 'typeError';
  range: Range;
  otherInfo: string[];
  message: string;
}

export interface ITypeResult {
  type: IType;
  errors: ITypeError[];
}
