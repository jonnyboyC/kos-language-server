import { IParseError, PartialNode } from './types';
import { Position } from 'vscode-languageserver';
import { Expr } from './expr';
import { Stmt } from './stmt';
import { Token } from '../entities/token';

export class ParseError implements IParseError {
  public readonly inner: IParseError[];

  public readonly token: Token;
  public readonly failed: FailedConstructor;
  public readonly message: string;
  public readonly moreInfo?: string;
  public partial?: PartialNode;

  constructor(
    token: Token,
    failed: FailedConstructor,
    message: string,
    moreInfo?: string,
    partial?: PartialNode,
  ) {
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
    public expr: Maybe<Constructor<Expr>>,
  ) {}
}

export const failedExpr = (
  expr: Maybe<Constructor<Expr>>,
): FailedConstructor => {
  return new FailedConstructor(undefined, expr);
};

export const failedStmt = (
  stmt: Maybe<Constructor<Stmt>>,
): FailedConstructor => {
  return new FailedConstructor(stmt, undefined);
};

export const failedUnknown = (): FailedConstructor => {
  return new FailedConstructor(undefined, undefined);
};
