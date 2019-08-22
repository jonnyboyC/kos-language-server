import { createType, noMap } from '../../typeCreators';
import { connectionType } from './connection';

export const vesselConnectionType = createType('vesselConnection');
vesselConnectionType.addSuper(noMap(connectionType));
