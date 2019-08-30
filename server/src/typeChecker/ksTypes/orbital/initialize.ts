import { orbitableType } from './orbitable';
import { serializableType } from '../primitives/serializeableStructure';
import {
  createSuffixType,
  createArgSuffixType,
  noMap,
} from '../../utilities/typeCreators';
import { stringType } from '../primitives/string';
import { scalarType } from '../primitives/scalar';
import { booleanType } from '../primitives/boolean';
import { directionType } from '../collections/direction';
import { orbitInfoType } from '../orbitInfo';
import { vectorType } from '../collections/vector';
import { orbitableVelocityType } from '../orbitalVelocity';
import { geoCoordinatesType } from '../geoCoordinates';
import { userListType } from '../collections/userList';
import { bodyAtmosphereType } from '../bodyatmosphere';
import { listType } from '../collections/list';
import { partType } from '../parts/part';
import { dockingPortType } from '../parts/dockingPort';
import { decouplerType } from '../parts/decoupler';
import { flightControlType } from '../flightControl';
import { aggregateResourceType } from '../parts/aggregateResource';
import { loadDistanceType } from '../loadDistance';
import { vesselConnectionType } from '../communication/vesselConnection';
import { messageQueueType } from '../communication/messageQueue';
import { noneType } from '../primitives/none';
import { uniqueSetType } from '../collections/uniqueset';
import { userDelegateType } from '../userDelegate';
import { bodyTargetType } from './bodyTarget';
import { vesselTargetType } from './vesselTarget';
import { partModuleType } from '../parts/partModule';
import { crewType } from '../crew';
import { vesselSensorsType } from '../vessel/vesselSensors';
import { OperatorKind } from '../../types';
import { boundsType } from '../parts/bounds';
import { Operator } from '../../types/operator';

let set = false;

export const orbitalInitializer = () => {
  if (set) {
    return;
  }
  set = true;

  orbitableType.addSuper(noMap(serializableType));
  orbitableType.addSuffixes(
    noMap(createSuffixType('name', stringType)),
    noMap(createSuffixType('apoapsis', scalarType)),
    noMap(createSuffixType('periapsis', scalarType)),
    noMap(createSuffixType('body', bodyTargetType)),
    noMap(createArgSuffixType('hasBody', booleanType)),
    noMap(createArgSuffixType('hasObt', booleanType)),
    noMap(createArgSuffixType('hasOrbit', booleanType)),
    noMap(createSuffixType('up', directionType)),
    noMap(createSuffixType('north', directionType)),
    noMap(createSuffixType('prograde', directionType)),
    noMap(createSuffixType('retrograde', directionType)),
    noMap(createSuffixType('srfPrograde', directionType)),
    noMap(createSuffixType('srfRetrograde', directionType)),
    noMap(createSuffixType('obt', orbitInfoType)),
    noMap(createSuffixType('orbit', orbitInfoType)),
    noMap(createSuffixType('position', vectorType)),
    noMap(createSuffixType('velocity', orbitableVelocityType)),
    noMap(createSuffixType('distance', scalarType)),
    noMap(createSuffixType('direction', directionType)),
    noMap(createSuffixType('latitude', scalarType)),
    noMap(createSuffixType('longitude', scalarType)),
    noMap(createSuffixType('altitude', scalarType)),
    noMap(createSuffixType('geoPosition', geoCoordinatesType)),
    noMap(createSuffixType('patches', listType.apply(orbitInfoType))),
  );

  bodyTargetType.addSuper(noMap(orbitableType));
  bodyTargetType.addSuffixes(
    noMap(createSuffixType('name', stringType)),
    noMap(createSuffixType('description', stringType)),
    noMap(createSuffixType('mass', scalarType)),
    noMap(createSuffixType('hasOcean', booleanType)),
    noMap(createSuffixType('hasSolidSurface', booleanType)),
    noMap(createSuffixType('orbitingChildren', listType.apply(bodyTargetType))),
    noMap(createSuffixType('altitude', scalarType)),
    noMap(createSuffixType('radius', scalarType)),
    noMap(createSuffixType('mu', scalarType)),
    noMap(createSuffixType('rotationPeriod', scalarType)),
    noMap(createSuffixType('atm', bodyAtmosphereType)),
    noMap(createSuffixType('angularVel', vectorType)),
    noMap(createSuffixType('soiRadius', scalarType)),
    noMap(createSuffixType('rotationAngle', scalarType)),
    noMap(createArgSuffixType('geoPositionOf', geoCoordinatesType, vectorType)),
    noMap(createArgSuffixType('altitudeOf', scalarType, vectorType)),
    noMap(
      createArgSuffixType(
        'geoPositionLatLng',
        geoCoordinatesType,
        scalarType,
        scalarType,
      ),
    ),
  );

  bodyTargetType.addOperators(
    new Operator(
      bodyTargetType,
      OperatorKind.equal,
      booleanType,
      bodyTargetType,
    ),
    new Operator(
      bodyTargetType,
      OperatorKind.notEqual,
      booleanType,
      bodyTargetType,
    ),
  );

  vesselTargetType.addSuper(noMap(orbitableType));
  vesselTargetType.addSuffixes(
    noMap(
      createArgSuffixType('partsNamed', listType.apply(partType), stringType),
    ),
    noMap(
      createArgSuffixType(
        'partsNamedPattern',
        listType.apply(partType),
        stringType,
      ),
    ),
    noMap(
      createArgSuffixType('partsTitled', listType.apply(partType), stringType),
    ),
    noMap(
      createArgSuffixType(
        'partsTitledPattern',
        listType.apply(partType),
        stringType,
      ),
    ),
    noMap(
      createArgSuffixType('partsDubbed', listType.apply(partType), stringType),
    ),
    noMap(
      createArgSuffixType(
        'partsDubbedPattern',
        listType.apply(partType),
        stringType,
      ),
    ),
    noMap(
      createArgSuffixType(
        'modulesNamed',
        listType.apply(partModuleType),
        stringType,
      ),
    ),
    noMap(
      createArgSuffixType('partsInGroup', listType.apply(partType), stringType),
    ),
    noMap(
      createArgSuffixType(
        'modulesInGroup',
        listType.apply(partModuleType),
        stringType,
      ),
    ),
    noMap(
      createArgSuffixType('partStagged', listType.apply(partType), stringType),
    ),
    noMap(
      createArgSuffixType(
        'partStaggedPattern',
        listType.apply(partType),
        stringType,
      ),
    ),
    noMap(createArgSuffixType('allTaggedParts', listType.apply(partType))),
    noMap(createArgSuffixType('parts', listType.apply(partType))),
    noMap(createArgSuffixType('dockingPorts', listType.apply(dockingPortType))),
    noMap(createArgSuffixType('decouplers', listType.apply(decouplerType))),
    noMap(createArgSuffixType('separators', listType.apply(decouplerType))),
    noMap(createArgSuffixType('elements', userListType)),
    noMap(createSuffixType('control', flightControlType)),
    noMap(createSuffixType('bearing', scalarType)),
    noMap(createSuffixType('heading', scalarType)),
    noMap(createSuffixType('availableThrust', scalarType)),
    noMap(createArgSuffixType('availableThrustAt', scalarType, scalarType)),
    noMap(createSuffixType('maxThrust', scalarType)),
    noMap(createArgSuffixType('maxThrustAt', scalarType, scalarType)),
    noMap(createSuffixType('facing', directionType)),
    noMap(createSuffixType('bounds', boundsType)),
    noMap(createSuffixType('angularMomentum', vectorType)),
    noMap(createSuffixType('angularVel', vectorType)),
    noMap(createSuffixType('mass', scalarType)),
    noMap(createSuffixType('verticalSpeed', scalarType)),
    noMap(createSuffixType('groundSpeed', scalarType)),
    noMap(createSuffixType('airSpeed', scalarType)),
    noMap(createSuffixType('shipName', stringType)),
    noMap(createSuffixType('name', stringType)),
    noMap(createSuffixType('type', stringType)),
    noMap(createSuffixType('sensors', vesselSensorsType)),
    noMap(createSuffixType('termVelocity', scalarType)),
    noMap(createSuffixType('dynamicPressure', scalarType)),
    noMap(createSuffixType('q', scalarType)),
    noMap(createSuffixType('loaded', booleanType)),
    noMap(createSuffixType('unpacked', booleanType)),
    noMap(createSuffixType('rootPart', partType)),
    noMap(createSuffixType('controlPart', partType)),
    noMap(createSuffixType('dryMass', scalarType)),
    noMap(createSuffixType('wetMass', scalarType)),
    noMap(createSuffixType('resources', listType.apply(aggregateResourceType))),
    noMap(createSuffixType('loadDistance', loadDistanceType)),
    noMap(createArgSuffixType('isDead', booleanType)),
    noMap(createSuffixType('status', stringType)),
    noMap(createSuffixType('latitude', scalarType)),
    noMap(createSuffixType('longitude', scalarType)),
    noMap(createSuffixType('altitude', scalarType)),
    noMap(createSuffixType('crew', listType.apply(crewType))),
    noMap(createSuffixType('crewCapacity', scalarType)),
    noMap(createSuffixType('connection', vesselConnectionType)),
    noMap(createSuffixType('messages', messageQueueType)),
    noMap(createArgSuffixType('startTracking', noneType)),
    noMap(
      createArgSuffixType(
        'soiChangeWatchers',
        uniqueSetType.apply(userDelegateType),
      ),
    ),
  );

  vesselTargetType.addOperators(
    new Operator(
      vesselTargetType,
      OperatorKind.equal,
      booleanType,
      vesselTargetType,
    ),
    new Operator(
      vesselTargetType,
      OperatorKind.notEqual,
      booleanType,
      vesselTargetType,
    ),
  );
};
