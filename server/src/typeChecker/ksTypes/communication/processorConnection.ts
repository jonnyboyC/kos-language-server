import { createType, noMap } from '../../typeCreators';
import { connectionType } from './connection';

export const processorConnectionType = createType(
  'processorConnection',
);
processorConnectionType.addSuper(noMap(connectionType));
