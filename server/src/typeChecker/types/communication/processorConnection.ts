import { IArgumentType } from '../types';
import { createStructureType } from '../ksType';
import { addPrototype } from '../typeUitlities';
import { connectionType } from './connection';

export const processorConnectionType: IArgumentType = createStructureType('processorConnection');
addPrototype(processorConnectionType, connectionType);
