import { createStructureType, noMap } from '../../typeCreators';
import { connectionType } from './connection';

export const homeConnectionType = createStructureType('homeConnection');
homeConnectionType.addSuper(noMap(connectionType));
