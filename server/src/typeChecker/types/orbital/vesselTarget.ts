import { IArgumentType } from '../types';
import { createStructureType, createArgSuffixType, createSuffixType } from '../ksType';
import { addPrototype, addSuffixes } from '../typeUitlities';
import { booleanType, stringType, scalarType } from '../primitives';
import { orbitableType } from './orbitable';
import { listType, userListType } from '../collections/list';
import { vectorType } from '../collections/vector';
import { directionType } from '../direction';
import { voidType } from '../void';
import { uniqueSetType } from '../collections/uniqueset';
import { partType } from '../part';
import { loadDistanceType } from '../loadDistance';
import { vesselConnectionType } from '../communication/vesselConnection';
import { messageQueueType } from '../communication/messageQueue';

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
  createArgSuffixType('dockingPorts', listType.toConcreteType(scalarType)), /* TODO */
  createArgSuffixType('decouplers', listType.toConcreteType(scalarType)), /* TODO */
  createArgSuffixType('separators', listType.toConcreteType(scalarType)), /* TODO */
  createArgSuffixType('elements', userListType),
  createSuffixType('control', /* TODO */ scalarType),
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
  createSuffixType('resources', listType.toConcreteType(scalarType)), /* TODO */
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
  createArgSuffixType('soiChangeWatchers', uniqueSetType.toConcreteType(scalarType)), /* TODO */
);
