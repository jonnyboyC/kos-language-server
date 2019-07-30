import { createStructureType } from '../../typeCreators';
import { connectionType } from './connection';

export const controlConnectionType = createStructureType('controlConnection');
controlConnectionType.addSuper(connectionType);
