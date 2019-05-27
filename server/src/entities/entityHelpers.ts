import { KsSymbol, KsSymbolKind } from '../analysis/types';
import { KsVariable } from './variable';
import { KsParameter } from './parameter';
import { KsFunction } from './function';

export const isKsVariable = (entity: KsSymbol): entity is KsVariable => {
  return entity.tag === KsSymbolKind.variable;
};

export const isKsParameter = (entity: KsSymbol): entity is KsParameter => {
  return entity.tag === KsSymbolKind.parameter;
};

export const isKsFunction = (entity: KsSymbol): entity is KsFunction => {
  return entity.tag === KsSymbolKind.function;
};

export const isKsLock = (entity: KsSymbol): entity is KsFunction => {
  return entity.tag === KsSymbolKind.lock;
};
