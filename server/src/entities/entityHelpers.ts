import { KsSymbol, KsSymbolKind } from '../analysis/types';
import { KsVariable } from './variable';
import { KsParameter } from './parameter';
import { KsFunction } from './function';
import { KsSuffix } from './suffix';
import { KsLock } from './lock';

/**
 * Check if the symbol is a variable
 * @param symbol symbol to check
 */
export const isVariable = (symbol: KsSymbol): symbol is KsVariable => {
  return symbol.tag === KsSymbolKind.variable;
};

/**
 * Check if the symbol is a parameter
 * @param symbol symbol to check
 */
export const isParameter = (symbol: KsSymbol): symbol is KsParameter => {
  return symbol.tag === KsSymbolKind.parameter;
};

/**
 * Check if the symbol is a function
 * @param symbol symbol to check
 */
export const isFunction = (symbol: KsSymbol): symbol is KsFunction => {
  return symbol.tag === KsSymbolKind.function;
};

/**
 * Check if the symbol is a lock
 * @param symbol symbol to check
 */
export const isLock = (symbol: KsSymbol): symbol is KsLock => {
  return symbol.tag === KsSymbolKind.lock;
};

/**
 * Check if the symbol is a suffix
 * @param symbol symbol to check
 */
export const isSuffix = (symbol: KsSymbol): symbol is KsSuffix => {
  return symbol.tag === KsSymbolKind.lock;
};
