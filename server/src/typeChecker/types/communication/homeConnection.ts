import { ArgumentType } from '../types';
import { createStructureType } from "../../typeCreators";
import { addPrototype } from '../../typeUitlities';
import { connectionType } from './connection';

export const homeConnectionType: ArgumentType = createStructureType('homeConnection');
addPrototype(homeConnectionType, connectionType);
