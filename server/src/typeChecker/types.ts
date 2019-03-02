import { IType } from './types/types';
import { Range } from 'vscode-languageserver';

export interface ITypeError extends Range {
  tag: 'typeError';
  range: Range;
  otherInfo: string[];
  message: string;
}

export interface ITypeResolved<T extends IType = IType> {
  type: T;
  termTrailers: IType[];
  atomType: 'function' | 'variable' | 'lock' | 'parameter';
  suffixTrailer?: ITypeSuffixResolved;
}

export interface ITypeSuffixResolved<T extends IType = IType> {
  type: T;
  termTrailers: IType[];
  suffixTrailer?: ITypeSuffixResolved;
}

export interface ITypeResolved<T extends IType = IType> extends ITypeSuffixResolved<T>  {
  atomType: 'function' | 'variable' | 'lock' | 'parameter';
}

export interface ITypeResult<T extends IType> {
  type: T;
  errors: ITypeError[];
}

export interface ITypeSuffixResult<
  T extends IType,
  R extends ITypeSuffixResolved = ITypeSuffixResolved> {
  type: T;
  resolved: R;
  errors: ITypeError[];
}
