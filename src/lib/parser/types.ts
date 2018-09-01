import { TokenInterface } from '../scanner/types'

export interface ParseErrorInterface {
    tag: 'parseError';
    token: TokenInterface;
    message: string;
}

export interface ExprInterface {
    tag: 'expr';
}

export interface InstructionInterface {
    tag: 'stmt';
}

export interface Scope {
    
}

type Result<T> = T | ParseErrorInterface;

export type ParseResult = Result<ExprInterface | InstructionInterface | TokenInterface>
export type ExprResult = Result<ExprInterface>
export type InstructionResult = Result<InstructionInterface>;
export type StmtResult = Result<InstructionInterface>
export type TokenResult = Result<TokenInterface>;