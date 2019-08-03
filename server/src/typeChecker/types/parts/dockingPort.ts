import {
  createStructureType,
  createSuffixType,
  createArgSuffixType,
} from '../../typeCreators';
import { decouplerType } from './decoupler';
import { scalarType } from '../primitives/scalar';
import { stringType } from '../primitives/string';
import { booleanType } from '../primitives/boolean';
import { voidType } from '../primitives/void';
import { directionType } from '../collections/direction';
import { vectorType } from '../collections/vector';
import { uniqueSetType } from '../collections/uniqueset';
import { userDelegateType } from '../userDelegate';

export const dockingPortType = createStructureType('dockingPort');
dockingPortType.addSuper(decouplerType);

dockingPortType.addSuffixes(
  createSuffixType('acquireRange', scalarType),
  createSuffixType('acquireForce', scalarType),
  createSuffixType('acquireTorque', scalarType),
  createSuffixType('reengagedDistance', scalarType),
  createSuffixType('dockedShipName', scalarType),
  createSuffixType('state', stringType),
  createSuffixType('targetTable', booleanType),
  createArgSuffixType('undock', voidType),
  createArgSuffixType('target', voidType),
  createArgSuffixType('portFacing', directionType),
  createArgSuffixType('nodePosition', vectorType),
  createArgSuffixType('nodeType', stringType),
  createArgSuffixType(
    'dockWatchers',
    uniqueSetType.toConcreteType(userDelegateType),
  ),
  createArgSuffixType(
    'undockWatchers',
    uniqueSetType.toConcreteType(userDelegateType),
  ),
);
