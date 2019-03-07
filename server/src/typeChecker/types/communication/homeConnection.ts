import { IArgumentType } from '../types';
import { createStructureType } from '../ksType';
import { addPrototype } from '../../typeUitlities';
import { connectionType } from './connection';

export const homeConnectionType: IArgumentType = createStructureType('homeConnection');
addPrototype(homeConnectionType, connectionType);
