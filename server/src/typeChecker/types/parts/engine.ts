import { ArgumentType } from '../types';
import {
  createStructureType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
} from '../../typeCreators';
import { addPrototype, addSuffixes } from '../../typeUtilities';
import { listType } from '../collections/list';
import { voidType } from '../primitives/void';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { partType } from './part';
import { gimbalType } from './gimbal';

export const engineType: ArgumentType = createStructureType('engine');
addPrototype(engineType, partType);

addSuffixes(
  engineType,
  createArgSuffixType('activate', voidType),
  createArgSuffixType('deactivate', voidType),
  createSetSuffixType('thrustLimit', scalarType),
  createSuffixType('maxThrust', scalarType),
  createSuffixType('thrust', scalarType),
  createSuffixType('fuelFlow', scalarType),
  createSuffixType('isp', scalarType),
  createSuffixType('vIsp', scalarType),
  createSuffixType('vacuumisp', scalarType),
  createSuffixType('slIsp', scalarType),
  createSuffixType('seaLevelIsp', scalarType),
  createSuffixType('flameOut', booleanType),
  createSuffixType('ignition', booleanType),
  createSuffixType('allowsRestart', booleanType),
  createSuffixType('allowsShutdown', booleanType),
  createSuffixType('throttleLock', booleanType),
  createArgSuffixType('ispAt', scalarType, scalarType),
  createArgSuffixType('maxThrustAt', scalarType, scalarType),
  createSuffixType('availableThrust', scalarType),
  createArgSuffixType('availableThrustAt', scalarType, scalarType),
  createSuffixType('multiMode', booleanType),
  createSuffixType('modes', listType.toConcreteType(stringType)),
  createSuffixType('mode', stringType),
  createArgSuffixType('toggleMode', voidType),
  createSetSuffixType('primaryMode', booleanType),
  createSetSuffixType('autoSwitch', booleanType),
  createSuffixType('hasGimbal', booleanType),
  createSuffixType('gimbal', gimbalType),
);
