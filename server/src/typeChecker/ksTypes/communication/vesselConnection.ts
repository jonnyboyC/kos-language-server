import { createType, noMap } from '../../utilities/typeCreators';
import { connectionType } from './connection';

export const vesselConnectionType = createType('vesselConnection');
vesselConnectionType.addSuper(noMap(connectionType));
