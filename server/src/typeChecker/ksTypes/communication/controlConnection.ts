import { createType, noMap } from '../../utilities/typeCreators';
import { connectionType } from './connection';

export const controlConnectionType = createType('controlConnection');
controlConnectionType.addSuper(noMap(connectionType));
