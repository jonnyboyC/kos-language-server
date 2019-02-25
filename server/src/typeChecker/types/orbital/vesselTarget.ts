import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../../typeUitlities';
import { orbitableType } from './orbitable';
import { listType } from '../collections/list';
import { vectorType } from '../collections/vector';
import { directionType } from '../direction';
import { uniqueSetType } from '../collections/uniqueset';
import { partType } from '../parts/part';
import { loadDistanceType } from '../loadDistance';
import { vesselConnectionType } from '../communication/vesselConnection';
import { messageQueueType } from '../communication/messageQueue';
import { voidType } from '../primitives/void';
import { userListType } from '../collections/userList';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { flightControlType } from '../flightControl';
import { dockingPortType } from '../parts/dockingPort';
import { decouplerType } from '../parts/decoupler';
import { aggregateResourceType } from '../aggregateResource';
import { userDelegateType } from '../userDelegate';

export const vesselTargetType: IArgumentType = createStructureType('vesselTarget');
addPrototype(vesselTargetType, orbitableType);

addSuffixes(
  vesselTargetType,
  createArgSuffixType('partsNamed', userListType, stringType),
  createArgSuffixType('partsNamedPattern', userListType, stringType),
  createArgSuffixType('partsTitled', userListType, stringType),
  createArgSuffixType('partsTitledPattern', userListType, stringType),
  createArgSuffixType('partsDubbed', userListType, stringType),
  createArgSuffixType('partsDubbedPattern', userListType, stringType),
  createArgSuffixType('modulesNamed', userListType, stringType),
  createArgSuffixType('partsInGroup', userListType, stringType),
  createArgSuffixType('modulesInGroup', userListType, stringType),
  createArgSuffixType('partStagged', userListType, stringType),
  createArgSuffixType('partStaggedPattern', userListType, stringType),
  createArgSuffixType('allTaggedParts', userListType),
  createArgSuffixType('parts', listType.toConcreteType(partType)),
  createArgSuffixType('dockingPorts', listType.toConcreteType(dockingPortType)),
  createArgSuffixType('decouplers', listType.toConcreteType(decouplerType)),
  createArgSuffixType('separators', listType.toConcreteType(decouplerType)),
  createArgSuffixType('elements', userListType),
  createSuffixType('control', flightControlType),
  createSuffixType('bearing', scalarType),
  createSuffixType('heading', scalarType),
  createSuffixType('availableThrust', scalarType),
  createArgSuffixType('availableThrustAt', scalarType, scalarType),
  createSuffixType('maxThrust', scalarType),
  createArgSuffixType('maxThrustAt', scalarType, scalarType),
  createSuffixType('facing', directionType),
  createSuffixType('angularMomentum', vectorType),
  createSuffixType('angularVel', vectorType),
  createSuffixType('mass', scalarType),
  createSuffixType('verticalSpeed', scalarType),
  createSuffixType('groundSpeed', scalarType),
  createSuffixType('airSpeed', scalarType),
  createSuffixType('shipName', stringType),
  createSuffixType('name', stringType),
  createSuffixType('type', stringType),
  createSuffixType('sensors', vesselTargetType),
  createSuffixType('termVelocity', scalarType),
  createSuffixType('dynamicPressure', scalarType),
  createSuffixType('q', scalarType),
  createSuffixType('loaded', booleanType),
  createSuffixType('unpacked', booleanType),
  createSuffixType('rootPart', partType),
  createSuffixType('controlPart', partType),
  createSuffixType('dryMass', scalarType),
  createSuffixType('wetMass', scalarType),
  createSuffixType('resources', listType.toConcreteType(aggregateResourceType)),
  createSuffixType('loadDistance', loadDistanceType),
  createArgSuffixType('isDead', booleanType),
  createSuffixType('status', stringType),
  createSuffixType('latitude', scalarType),
  createSuffixType('longitude', scalarType),
  createSuffixType('altitude', scalarType),
  createSuffixType('crew', userListType),
  createSuffixType('crewCapacity', scalarType),
  createSuffixType('connection', vesselConnectionType),
  createSuffixType('messages', messageQueueType),
  createArgSuffixType('startTracking', voidType),
  createArgSuffixType('soiChangeWatchers', uniqueSetType.toConcreteType(userDelegateType)),
);
