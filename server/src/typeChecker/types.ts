import { IType } from './types/types';
import { Range } from 'vscode-languageserver';
import * as SuffixTerm from '../parser/suffixTerm';

export interface ITypeError extends Range {
  tag: 'typeError';
  range: Range;
  otherInfo: string[];
  message: string;
}

export interface ITypeNode<T extends IType = IType> extends Range {
  type: T;
  node: SuffixTerm.SuffixTermBase;
}

export interface ITypeResolvedSuffix<T extends IType = IType> {
  node: ITypeNode<T>;
  termTrailers: ITypeNode[];
  suffixTrailer?: ITypeResolvedSuffix;
}

export interface ITypeResolved<T extends IType = IType> extends ITypeResolvedSuffix<T>  {
  atomType: 'function' | 'variable' | 'lock' | 'parameter';
}

export interface ITypeResult<T extends IType> {
  type: T;
  errors: ITypeError[];
}

export interface ITypeResultSuffix<
  T extends IType,
  R extends ITypeResolvedSuffix = ITypeResolvedSuffix> {
  type: T;
  resolved: R;
  errors: ITypeError[];
}
