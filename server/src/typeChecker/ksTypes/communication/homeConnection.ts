import { createType, noMap } from '../../typeCreators';
import { connectionType } from './connection';

export const homeConnectionType = createType('homeConnection');
homeConnectionType.addSuper(noMap(connectionType));
