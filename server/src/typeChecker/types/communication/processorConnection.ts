import { createStructureType } from '../../typeCreators';
import { connectionType } from './connection';

export const processorConnectionType = createStructureType(
  'processorConnection',
);
processorConnectionType.addSuper(connectionType);
