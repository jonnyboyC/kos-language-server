import { IToken } from '../scanner/types'
import { ExprBinary, ExprUnary, ExprFactor, ExprSuffix, ExprCall, ExprArrayIndex, ExprArrayBracket, ExprDelegate, ExprLiteral, ExprVariable, ExprGrouping, ExprAnonymousFunction } from './expr';

export interface IParseError {
    tag: 'parseError';
    token: IToken;
    otherInfo: string[];
    message: string;
    inner: IParseError[]
}

export interface IExpr extends IExprVisitable {
    tag: 'expr';
}

export interface IInst {
    tag: 'inst';
}

export interface IScope {
    declare?: IToken,
    scope?: IToken,
}

export interface IExprVisitor<T> {
    visitBinary(expr: ExprBinary): T;
    visitUnary(expr: ExprUnary): T;
    visitFactor(expr: ExprFactor): T;
    visitSuffix(expr: ExprSuffix): T;
    visitCall(expr: ExprCall): T;
    visitArrayIndex(expr: ExprArrayIndex): T;
    visitArrayBracket(expr: ExprArrayBracket): T;
    visitDelegate(expr: ExprDelegate): T;
    visitLiteral(expr: ExprLiteral): T;
    visitVariable(expr: ExprVariable): T;
    visitGrouping(expr: ExprGrouping): T;
    visitAnonymousFunction(expr: ExprAnonymousFunction): T;
}

export interface IExprVisitable {
    accept<T>(visitor: IExprVisitor<T>): T
}

export type Result<T> = T | IParseError;

export type ParseResult = Result<IExpr | IInst | IToken>
export type ExprResult = Result<IExpr>
export type InstResult = Result<IInst>;
export type StmtResult = Result<IInst>
export type TokenResult = Result<IToken>;