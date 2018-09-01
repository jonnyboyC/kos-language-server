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
    tag: 'stmt';
}

export interface Scope {

}

type Result<T> = T | ParseErrorInterface;

export type ParseResult = Result<ExprInterface | InstInterface | TokenInterface>
export type ExprResult = Result<ExprInterface>
export type InstructionResult = Result<InstInterface>;
export type StmtResult = Result<InstInterface>
export type TokenResult = Result<TokenInterface>;