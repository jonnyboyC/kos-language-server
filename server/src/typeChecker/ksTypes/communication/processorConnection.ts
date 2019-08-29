import { createType, noMap } from '../../utilities/typeCreators';
import { connectionType } from './connection';

export const processorConnectionType = createType(
  'processorConnection',
);
processorConnectionType.addSuper(noMap(connectionType));
