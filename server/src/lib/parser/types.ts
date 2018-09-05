import { TokenInterface } from '../scanner/types'

export interface ParseErrorInterface {
    tag: 'parseError';
    token: TokenInterface;
    message: string;
}

export interface ExprInterface {
    tag: 'expr';
}

export interface InstInterface {
    tag: 'inst';
}

export interface ScopeInterface {
    declare?: TokenInterface,
    scope?: TokenInterface,
}

export type Result<T> = T | ParseErrorInterface;

export type ParseResult = Result<ExprInterface | InstInterface | TokenInterface>
export type ExprResult = Result<ExprInterface>
export type InstResult = Result<InstInterface>;
export type StmtResult = Result<InstInterface>
export type TokenResult = Result<TokenInterface>;