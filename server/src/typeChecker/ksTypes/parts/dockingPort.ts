import {
  createType,
  createSuffixType,
  createArgSuffixType,
  noMap,
} from '../../typeCreators';
import { decouplerType } from './decoupler';
import { scalarType } from '../primitives/scalar';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { noneType } from '../primitives/none';
import { directionType } from '../collections/direction';
import { vectorType } from '../collections/vector';
import { uniqueSetType } from '../collections/uniqueset';
import { userDelegateType } from '../userDelegate';

export const dockingPortType = createType('dockingPort');
dockingPortType.addSuper(noMap(decouplerType));

dockingPortType.addSuffixes(
  noMap(createSuffixType('acquireRange', scalarType)),
  noMap(createSuffixType('acquireForce', scalarType)),
  noMap(createSuffixType('acquireTorque', scalarType)),
  noMap(createSuffixType('reengagedDistance', scalarType)),
  noMap(createSuffixType('dockedShipName', stringType)),
  noMap(createSuffixType('state', stringType)),
  noMap(createSuffixType('targetTable', booleanType)),
  noMap(createArgSuffixType('undock', noneType)),
  noMap(createArgSuffixType('target', noneType)),
  noMap(createArgSuffixType('portFacing', directionType)),
  noMap(createArgSuffixType('nodePosition', vectorType)),
  noMap(createArgSuffixType('nodeType', stringType)),
  noMap(
    createArgSuffixType('dockWatchers', uniqueSetType.apply(userDelegateType)),
  ),
  noMap(
    createArgSuffixType(
      'undockWatchers',
      uniqueSetType.apply(userDelegateType),
    ),
  ),
);
