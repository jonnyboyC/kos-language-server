import { IType } from './types/types';
import { Range } from 'vscode-languageserver';

export interface ITypeError extends Range {
  tag: 'typeError';
  range: Range;
  otherInfo: string[];
  message: string;
}

export interface ITypeResult<T extends IType> {
  type: T;
  errors: ITypeError[];
}
