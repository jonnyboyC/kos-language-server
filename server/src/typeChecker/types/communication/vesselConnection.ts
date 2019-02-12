import { IArgumentType } from '../types';
import { createStructureType } from '../ksType';
import { addPrototype } from '../typeUitlities';
import { connectionType } from './connection';

export const vesselConnectionType: IArgumentType = createStructureType('vesselConnection');
addPrototype(vesselConnectionType, connectionType);
