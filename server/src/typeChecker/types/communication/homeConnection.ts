import { ArgumentType } from '../types';
import { createStructureType } from "../../typeCreators";
import { addPrototype } from '../../typeUtilities';
import { connectionType } from './connection';

export const homeConnectionType: ArgumentType = createStructureType('homeConnection');
addPrototype(homeConnectionType, connectionType);
