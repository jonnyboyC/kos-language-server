import { IArgumentType } from '../types';
import { createStructureType } from '../ksType';
import { addPrototype } from '../../typeUitlities';
import { connectionType } from './connection';

export const controlConnectionType: IArgumentType = createStructureType('controlConnection');
addPrototype(controlConnectionType, connectionType);
