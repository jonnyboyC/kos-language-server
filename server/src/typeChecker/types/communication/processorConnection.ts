import { ArgumentType } from '../types';
import { createStructureType } from "../../typeCreators";
import { addPrototype } from '../../typeUitlities';
import { connectionType } from './connection';

export const processorConnectionType: ArgumentType = createStructureType('processorConnection');
addPrototype(processorConnectionType, connectionType);
