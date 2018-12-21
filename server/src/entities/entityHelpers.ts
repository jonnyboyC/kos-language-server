import { KsEntity } from '../analysis/types';
import { KsVariable } from './variable';
import { KsParameter } from './parameters';
import { KsFunction } from './function';

export const isKsVariable = (entity: KsEntity): entity is KsVariable => {
  return entity.tag === 'variable';
};

export const isKsParameter = (entity: KsEntity): entity is KsParameter => {
  return entity.tag === 'parameter';
};

export const isKsFunction = (entity: KsEntity): entity is KsFunction => {
  return entity.tag === 'function';
};

export const isKsLock = (entity: KsEntity): entity is KsFunction => {
  return entity.tag === 'lock';
};
