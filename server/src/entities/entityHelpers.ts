import { KsEntity, EntityType } from '../analysis/types';
import { KsVariable } from './variable';
import { KsParameter } from './parameters';
import { KsFunction } from './function';

export const isKsVariable = (entity: KsEntity): entity is KsVariable => {
  return entity.tag === EntityType.variable;
};

export const isKsParameter = (entity: KsEntity): entity is KsParameter => {
  return entity.tag === EntityType.parameter;
};

export const isKsFunction = (entity: KsEntity): entity is KsFunction => {
  return entity.tag === EntityType.function;
};

export const isKsLock = (entity: KsEntity): entity is KsFunction => {
  return entity.tag === EntityType.lock;
};
