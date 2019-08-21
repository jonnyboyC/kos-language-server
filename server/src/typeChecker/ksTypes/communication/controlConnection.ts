import { createType, noMap } from '../../typeCreators';
import { connectionType } from './connection';

export const controlConnectionType = createType('controlConnection');
controlConnectionType.addSuper(noMap(connectionType));
