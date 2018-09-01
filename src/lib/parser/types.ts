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

export type ParseResult = ExprInterface | ParseErrorInterface | InstructionInterface | TokenInterface
export type ExprResult = ExprInterface | ParseErrorInterface;
export type InstructionResult = InstructionInterface | ParseErrorInterface;
export type StmtResult = InstructionInterface | ParseErrorInterface;
export type TokenResult = TokenInterface | ParseErrorInterface;