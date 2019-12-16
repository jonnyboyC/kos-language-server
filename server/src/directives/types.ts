import { TokenType } from "../models/tokentypes";
import { Token } from "../models/token";

export interface DirectiveTokens<T extends TokenType = TokenType> {
  directive: Token<T>;
  tokens: Token[];
}