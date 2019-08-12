import { createStructureType, noMap } from '../../typeCreators';
import { connectionType } from './connection';

export const vesselConnectionType = createStructureType('vesselConnection');
vesselConnectionType.addSuper(noMap(connectionType));
