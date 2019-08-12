import { createStructureType, noMap } from '../../typeCreators';
import { connectionType } from './connection';

export const processorConnectionType = createStructureType(
  'processorConnection',
);
processorConnectionType.addSuper(noMap(connectionType));
