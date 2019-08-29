import { createType, noMap } from '../../utilities/typeCreators';
import { connectionType } from './connection';

export const homeConnectionType = createType('homeConnection');
homeConnectionType.addSuper(noMap(connectionType));
