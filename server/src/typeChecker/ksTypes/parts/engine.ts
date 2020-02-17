import {
  createType,
  createArgSuffixType,
  createSuffixType,
  createSetSuffixType,
  noMap,
} from '../../utilities/typeCreators';
import { listType } from '../collections/list';
import { noneType } from '../primitives/none';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { partType } from './part';
import { gimbalType } from './gimbal';
import { lexiconType } from '../collections/lexicon';

export const engineType = createType('engine');
engineType.addSuper(noMap(partType));

engineType.addSuffixes(
  noMap(createArgSuffixType('activate', noneType)),
  noMap(createArgSuffixType('deactivate', noneType)),
  noMap(createSetSuffixType('thrustLimit', scalarType)),
  noMap(createSuffixType('maxThrust', scalarType)),
  noMap(createSuffixType('thrust', scalarType)),
  noMap(createSuffixType('fuelFlow', scalarType)),
  noMap(createSuffixType('maxFuelFlow', scalarType)),
  noMap(createSuffixType('massFlow', scalarType)),
  noMap(createSuffixType('maxMassFlow', scalarType)),
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
  noMap(createSuffixType('possibleThrust', scalarType)),
  noMap(createArgSuffixType('possibleThrustAt', scalarType, scalarType)),
  noMap(createSuffixType('maxPossibleThrust', scalarType)),
  noMap(createArgSuffixType('maxPossibleThrustAt', scalarType, scalarType)),
  noMap(createSuffixType('consumedResources', lexiconType)),
  noMap(createSuffixType('multiMode', booleanType)),
  noMap(createSuffixType('modes', listType.apply(stringType))),
  noMap(createSuffixType('mode', stringType)),
  noMap(createArgSuffixType('toggleMode', noneType)),
  noMap(createSetSuffixType('primaryMode', booleanType)),
  noMap(createSetSuffixType('autoSwitch', booleanType)),
  noMap(createSuffixType('hasGimbal', booleanType)),
  noMap(createSuffixType('gimbal', gimbalType)),
  noMap(createSuffixType('ullage', booleanType)),
  noMap(createSuffixType('fuelStability', scalarType)),
  noMap(createSuffixType('pressureFed', booleanType)),
  noMap(createSuffixType('ignitions', scalarType)),
  noMap(createSuffixType('minThrottle', scalarType)),
  noMap(createSuffixType('config', stringType)),
);
