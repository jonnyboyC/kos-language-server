import { addPrototype, addSuffixes } from '../../typeUitlities';
import { orbitableType } from './orbitable';
import { serializableStructureType } from '../primitives/serializeableStructure';
import { createSuffixType, createArgSuffixType } from "../../typeCreators";
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { directionType } from '../direction';
import { orbitInfoType } from '../orbitInfo';
import { vectorType } from '../collections/vector';
import { orbitableVelocityType } from '../orbitalVelocity';
import { geoCoordinatesType } from '../geoCoordinates';
import { userListType } from '../collections/userList';
import { structureType } from '../primitives/structure';
import { bodyAtmosphereType } from '../bodyatmosphere';
import { listType } from '../collections/list';
import { partType } from '../parts/part';
import { dockingPortType } from '../parts/dockingPort';
import { decouplerType } from '../parts/decoupler';
import { flightControlType } from '../flightControl';
import { aggregateResourceType } from '../aggregateResource';
import { loadDistanceType } from '../loadDistance';
import { vesselConnectionType } from '../communication/vesselConnection';
import { messageQueueType } from '../communication/messageQueue';
import { voidType } from '../primitives/void';
import { uniqueSetType } from '../collections/uniqueset';
import { userDelegateType } from '../userDelegate';
import { bodyTargetType } from './bodyTarget';
import { vesselTargetType } from './vesselTarget';

export const oribitalInitializer = () => {

  addPrototype(orbitableType, serializableStructureType);
  addSuffixes(
    orbitableType,
    createSuffixType('name', stringType),
    createSuffixType('apoapsis', scalarType),
    createSuffixType('periapsis', scalarType),
    createSuffixType('body', bodyTargetType),
    createArgSuffixType('hasBody', booleanType),
    createArgSuffixType('hasObt', booleanType),
    createArgSuffixType('hasOrbit', booleanType),
    createSuffixType('up', directionType),
    createSuffixType('north', directionType),
    createSuffixType('prograde', directionType),
    createSuffixType('retrograde', directionType),
    createSuffixType('srfPrograde', directionType),
    createSuffixType('srfRetrograde', directionType),
    createSuffixType('obt', orbitInfoType),
    createSuffixType('orbit', orbitInfoType),
    createSuffixType('position', vectorType),
    createSuffixType('velocity', orbitableVelocityType),
    createSuffixType('distance', scalarType),
    createSuffixType('direction', directionType),
    createSuffixType('latitude', scalarType),
    createSuffixType('longitude', scalarType),
    createSuffixType('altitude', scalarType),
    createSuffixType('geoPosition', geoCoordinatesType),
    createSuffixType('patches', userListType),
  );

  addPrototype(bodyTargetType, orbitableType);
  addSuffixes(
    bodyTargetType,
    createSuffixType('name', structureType),
    createSuffixType('description', stringType),
    createSuffixType('mass', scalarType),
    createSuffixType('hasOcean', booleanType),
    createSuffixType('hasSolidSurface', booleanType),
    createSuffixType('orbitingChildren', userListType),
    createSuffixType('altitude', scalarType),
    createSuffixType('radius', scalarType),
    createSuffixType('mu', scalarType),
    createSuffixType('rotationPeriod', scalarType),
    createSuffixType('atm', bodyAtmosphereType),
    createSuffixType('angularVel', vectorType),
    createSuffixType('soiRadius', scalarType),
    createSuffixType('rotationAngle', scalarType),
    createArgSuffixType('geoPositionOf', geoCoordinatesType, vectorType),
    createArgSuffixType('altitudeOf', scalarType, vectorType),
    createArgSuffixType('geoPositionLatLng', geoCoordinatesType, scalarType, scalarType),
  );

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
};
