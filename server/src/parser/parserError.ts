import { IParseError, PartialNode } from './types';
import { IToken } from '../entities/types';
import { Position } from 'vscode-languageserver';
import { Expr } from './expr';
import { Stmt } from './stmt';

export class ParseError implements IParseError {
  public readonly inner: IParseError[];

  public readonly token: IToken;
  public readonly failed: FailedConstructor;
  public readonly message: string;
  public readonly moreInfo?: string;
  public readonly partial?: PartialNode;

  constructor(
    token: IToken,
    failed: FailedConstructor,
    message: string,
    moreInfo?: string,
    partial?: PartialNode) {

    this.token = token;
    this.failed = failed;
    this.message = message;
    this.moreInfo = moreInfo;

    this.partial = partial;

    this.inner = [];
  }

  get start(): Position {
    return this.token.start;
  }

  get end(): Position {
    return this.token.end;
  }

  get tag(): 'parseError' {
    return 'parseError';
  }
}

export class FailedConstructor {
  constructor(
    public stmt: Maybe<Constructor<Stmt>>,
    public expr: Maybe<Constructor<Expr>>) {
  }
}

export const failedExpr = (expr: Maybe<Constructor<Expr>>): FailedConstructor => {
  return new FailedConstructor(undefined, expr);
};

export const failedStmt = (stmt: Maybe<Constructor<Stmt>>): FailedConstructor => {
  return new FailedConstructor(stmt, undefined);
};

export const failedUnknown = (): FailedConstructor => {
  return new FailedConstructor(undefined, undefined);
};
