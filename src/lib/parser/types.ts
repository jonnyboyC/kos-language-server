import { TokenInterface } from '../scanner/types'

export interface ParseErrorInterface {
    tag: 'parseError';
    token: TokenInterface;
    message: string;
}

export interface ExprInterface {
    tag: 'expr';
}

export interface StmtInterface {
    tag: 'stmt';
}

export type ParseResult = ExprInterface | ParseErrorInterface | StmtInterface | TokenInterface
export type ExprResult = ExprInterface | ParseErrorInterface;
export type StmtResult = StmtInterface | ParseErrorInterface;
export type TokenResult = TokenInterface | ParseErrorInterface;