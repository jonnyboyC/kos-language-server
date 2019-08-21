import {
  createType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../../typeCreators';
import { listType } from '../collections/list';
import { voidType } from '../primitives/void';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { partType } from './part';
import { gimbalType } from './gimbal';

export const engineType = createType('engine');
engineType.addSuper(noMap(partType));

engineType.addSuffixes(
  noMap(createArgSuffixType('activate', voidType)),
  noMap(createArgSuffixType('deactivate', voidType)),
  noMap(createSetSuffixType('thrustLimit', scalarType)),
  noMap(createSuffixType('maxThrust', scalarType)),
  noMap(createSuffixType('thrust', scalarType)),
  noMap(createSuffixType('fuelFlow', scalarType)),
  noMap(createSuffixType('isp', scalarType)),
  noMap(createSuffixType('vIsp', scalarType)),
  noMap(createSuffixType('vacuumisp', scalarType)),
  noMap(createSuffixType('slIsp', scalarType)),
  noMap(createSuffixType('seaLevelIsp', scalarType)),
  noMap(createSuffixType('flameOut', booleanType)),
  noMap(createSuffixType('ignition', booleanType)),
  noMap(createSuffixType('allowsRestart', booleanType)),
  noMap(createSuffixType('allowsShutdown', booleanType)),
  noMap(createSuffixType('throttleLock', booleanType)),
  noMap(createArgSuffixType('ispAt', scalarType, scalarType)),
  noMap(createArgSuffixType('maxThrustAt', scalarType, scalarType)),
  noMap(createSuffixType('availableThrust', scalarType)),
  noMap(createArgSuffixType('availableThrustAt', scalarType, scalarType)),
  noMap(createSuffixType('multiMode', booleanType)),
  noMap(createSuffixType('modes', listType.apply(stringType))),
  noMap(createSuffixType('mode', stringType)),
  noMap(createArgSuffixType('toggleMode', voidType)),
  noMap(createSetSuffixType('primaryMode', booleanType)),
  noMap(createSetSuffixType('autoSwitch', booleanType)),
  noMap(createSuffixType('hasGimbal', booleanType)),
  noMap(createSuffixType('gimbal', gimbalType)),
);
