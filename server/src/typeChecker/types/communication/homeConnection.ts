import { createStructureType } from '../../typeCreators';
import { connectionType } from './connection';

export const homeConnectionType = createStructureType('homeConnection');
homeConnectionType.addSuper(connectionType);
