import { ScopeKind } from '../parser/types';
import { Token } from '../models/token';
import { TokenType } from '../models/tokentypes';
import { queueType } from '../typeChecker/ksTypes/collections/queue';
import { structureType } from '../typeChecker/ksTypes/primitives/structure';
import { listType } from '../typeChecker/ksTypes/collections/list';
import { stackType } from '../typeChecker/ksTypes/collections/stack';
import { uniqueSetType } from '../typeChecker/ksTypes/collections/uniqueset';
import { nodeType } from '../typeChecker/ksTypes/node';
import { constantType } from '../typeChecker/ksTypes/constant';
import { pathType } from '../typeChecker/ksTypes/io/path';
import { volumeType } from '../typeChecker/ksTypes/io/volume';
import { vectorType } from '../typeChecker/ksTypes/collections/vector';
import { rgbaType } from '../typeChecker/ksTypes/rgba';
import { directionType } from '../typeChecker/ksTypes/collections/direction';
import { kacAlarmType } from '../typeChecker/ksTypes/kacAlarmWrapper';
import { geoCoordinatesType } from '../typeChecker/ksTypes/geoCoordinates';
import { bodyAtmosphereType } from '../typeChecker/ksTypes/bodyatmosphere';
import { noteType } from '../typeChecker/ksTypes/note';
import { voiceType } from '../typeChecker/ksTypes/voice';
import { hsvaType } from '../typeChecker/ksTypes/hsva';
import { vectorRendererType } from '../typeChecker/ksTypes/vectorRenderer';
import { guiWidgetType } from '../typeChecker/ksTypes/gui/guiWidget';
import { orbitableType } from '../typeChecker/ksTypes/orbital/orbitable';
import { timeSpanType } from '../typeChecker/ksTypes/timespan';
import { highlightType } from '../typeChecker/ksTypes/highlight';
import { orbitInfoType } from '../typeChecker/ksTypes/orbitInfo';
import { careerType } from '../typeChecker/ksTypes/career';
import { waypointType } from '../typeChecker/ksTypes/waypoint';
import { resourceTransferType } from '../typeChecker/ksTypes/resourceTransfer';
import { builtIn, DEFAULT_BODIES } from '../utilities/constants';
import { lexiconType } from '../typeChecker/ksTypes/collections/lexicon';
import { rangeType } from '../typeChecker/ksTypes/collections/range';
import { SymbolTableBuilder } from './models/symbolTableBuilder';
import { volumeFileType } from '../typeChecker/ksTypes/io/volumneFile';
import { pidLoopType } from '../typeChecker/ksTypes/pidLoop';
import { volumeItemType } from '../typeChecker/ksTypes/io/volumeItem';
import { volumeDirectoryType } from '../typeChecker/ksTypes/io/volumeDirectory';
import {
  createFunctionType,
  createVarFunctionType,
  createVarType,
  createUnion,
} from '../typeChecker/utilities/typeCreators';
import { delegateType } from '../typeChecker/ksTypes/primitives/delegate';
import { kUniverseType } from '../typeChecker/ksTypes/kUniverse';
import { homeConnectionType } from '../typeChecker/ksTypes/communication/homeConnection';
import { controlConnectionType } from '../typeChecker/ksTypes/communication/controlConnection';
import { vesselAltType } from '../typeChecker/ksTypes/vessel/vesselAlt';
import { vesselEtaType } from '../typeChecker/ksTypes/vessel/vesselEta';
import { stageType } from '../typeChecker/ksTypes/vessel/stage';
import { steeringManagerType } from '../typeChecker/ksTypes/steeringManager';
import { terminalStructType } from '../typeChecker/ksTypes/terminalStruct';
import { noneType } from '../typeChecker/ksTypes/primitives/none';
import { userListType } from '../typeChecker/ksTypes/collections/userList';
import {
  scalarType,
  doubleType,
  integerType,
} from '../typeChecker/ksTypes/primitives/scalar';
import { stringType } from '../typeChecker/ksTypes/primitives/string';
import { booleanType } from '../typeChecker/ksTypes/primitives/boolean';
import { coreType } from '../typeChecker/ksTypes/core';
import { versionInfoType } from '../typeChecker/ksTypes/versionInfo';
import { configType } from '../typeChecker/ksTypes/config';
import { builtInDelegateType } from '../typeChecker/ksTypes/primitives/builtInDelegate';
import { addonListType } from '../typeChecker/ksTypes/addon/addonList';
import { vesselSensorsType } from '../typeChecker/ksTypes/vessel/vesselSensors';
import { serializableType } from '../typeChecker/ksTypes/primitives/serializeableStructure';
import { bodyTargetType } from '../typeChecker/ksTypes/orbital/bodyTarget';
import { vesselTargetType } from '../typeChecker/ksTypes/orbital/vesselTarget';
import { SymbolTable } from './models/symbolTable';
import { toCase } from '../utilities/stringUtils';
import { Marker } from '../scanner/models/marker';
import { boundsType } from '../typeChecker/ksTypes/parts/bounds';
import { IType } from '../typeChecker/types';
import { empty } from '../utilities/typeGuards';
import { partType } from '../typeChecker/ksTypes/parts/part';
import { kosProcessorFieldsType } from '../typeChecker/ksTypes/kosProcessorFields';
import { orbitableVelocityType } from '../typeChecker/ksTypes/orbitalVelocity';

const functionTypes: [string[], IType][] = [
  [['abs'], createFunctionType('abs', scalarType, scalarType)],
  [['add'], createFunctionType('add', noneType, nodeType)],
  [
    ['add', 'alarm'],
    createFunctionType(
      'addalarm',
      kacAlarmType,
      stringType,
      stringType,
      scalarType,
      stringType,
    ),
  ],
  [
    ['all', 'waypoints'],
    createFunctionType('allwaypoints', listType.apply(waypointType)),
  ],
  [
    ['angle', 'axis'],
    createFunctionType('angleaxis', directionType, vectorType, scalarType),
  ],
  [
    ['angle', 'diff'],
    createFunctionType('anglediff', doubleType, scalarType, scalarType),
  ],
  [['arc', 'cos'], createFunctionType('arccos', doubleType, scalarType)],
  [['arc', 'sin'], createFunctionType('arcsin', doubleType, scalarType)],
  [['arc', 'tan'], createFunctionType('arctan', doubleType, scalarType)],
  [
    ['arc', 'tan2'],
    createFunctionType('arctan2', doubleType, scalarType, scalarType),
  ],
  // TODO need to figure out name collision for scope manager
  // createFunctionType('body', bodyTargetType, stringType)],
  [
    ['body', 'atmosphere'],
    createFunctionType('bodyatmosphere', bodyAtmosphereType, stringType),
  ],
  [
    ['body', 'exists'],
    createFunctionType('bodyExists', booleanType, stringType),
  ],
  [
    ['bounds'],
    createFunctionType(
      'bounds',
      boundsType,
      vectorType,
      directionType,
      vectorType,
      vectorType,
    ),
  ],
  [
    ['build', 'list'],
    createFunctionType('buildlist', listType.apply(structureType), stringType),
  ],
  [['career'], createFunctionType('career', careerType)],
  [
    ['cd'],
    createFunctionType(
      'cd',
      noneType,
      createUnion(true, stringType, pathType, noneType),
    ),
  ],
  [
    ['ceiling'],
    createFunctionType(
      'ceiling',
      scalarType,
      scalarType,
      createUnion(true, scalarType, noneType),
    ),
  ],
  [['char'], createFunctionType('char', stringType, scalarType)],
  [
    ['chdir'],
    createFunctionType(
      'chdir',
      noneType,
      createUnion(true, stringType, pathType, noneType),
    ),
  ],
  [['clear', 'guis'], createFunctionType('clearguis', noneType)],
  [['clear', 'screen'], createFunctionType('clearscreen', noneType)],
  [['clear', 'vec', 'draws'], createFunctionType('clearvecdraws', noneType)],
  [['constant'], createFunctionType('constant', constantType)],
  [
    ['copy', 'path'],
    createFunctionType(
      'copypath',
      noneType,
      createUnion(true, stringType, pathType),
      createUnion(true, stringType, pathType),
    ),
  ],
  [['cos'], createFunctionType('cos', doubleType, scalarType)],
  [
    ['create'],
    createFunctionType(
      'create',
      volumeFileType,
      createUnion(true, stringType, pathType),
    ),
  ],
  [
    ['create', 'orbit'],
    createFunctionType(
      'createorbit',
      orbitableType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
    ),
  ],
  [
    ['create', 'dir'],
    createFunctionType(
      'createdir',
      volumeDirectoryType,
      createUnion(true, stringType, pathType),
    ),
  ],
  [['debug', 'dump'], createFunctionType('debugdump', stringType)],
  [
    ['debug', 'freeze', 'game'],
    createFunctionType('debugfreezegame', noneType, scalarType),
  ],
  [
    ['delete', 'alarm'],
    createFunctionType('deleteAlarm', booleanType, stringType),
  ],
  [
    ['delete', 'path'],
    createFunctionType(
      'deletepath',
      booleanType,
      createUnion(true, stringType, pathType),
    ),
  ],
  [
    ['edit'],
    createFunctionType(
      'edit',
      noneType,
      createUnion(true, stringType, pathType),
    ),
  ],
  [
    ['exists'],
    createFunctionType(
      'exists',
      booleanType,
      createUnion(true, stringType, pathType),
    ),
  ],
  [
    ['floor'],
    createFunctionType(
      'floor',
      scalarType,
      scalarType,
      createUnion(true, scalarType, noneType),
    ),
  ],
  [['get', 'voice'], createFunctionType('getvoice', voiceType, integerType)],
  [
    ['gui'],
    createFunctionType(
      'gui',
      guiWidgetType,
      integerType,
      createUnion(true, integerType, noneType),
    ),
  ],
  [
    ['heading'],
    createFunctionType(
      'heading',
      directionType,
      scalarType,
      scalarType,
      createUnion(true, scalarType, noneType),
    ),
  ],
  [
    ['highlight'],
    createFunctionType('highlight', highlightType, structureType, rgbaType),
  ],
  [
    ['hsv'],
    createFunctionType('hsv', hsvaType, scalarType, scalarType, scalarType),
  ],
  [
    ['hsva'],
    createFunctionType(
      'hsva',
      hsvaType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
    ),
  ],
  [
    ['hudtext'],
    createFunctionType(
      'hudtext',
      noneType,
      stringType,
      scalarType,
      scalarType,
      scalarType,
      rgbaType,
      booleanType,
    ),
  ],
  [
    ['latlng'],
    createFunctionType('latlng', geoCoordinatesType, scalarType, scalarType),
  ],
  [
    ['lex'],
    createVarFunctionType('lex', lexiconType, createVarType(structureType)),
  ],
  [
    ['lexicon'],
    createVarFunctionType('lexicon', lexiconType, createVarType(structureType)),
  ],
  [
    ['list'],
    createVarFunctionType('list', userListType, createVarType(structureType)),
  ],
  [
    ['list', 'alarms'],
    createFunctionType('listAlarms', listType.apply(kacAlarmType), stringType),
  ],
  [['ln'], createFunctionType('ln', doubleType, scalarType)],
  [['log10'], createFunctionType('log10', doubleType, scalarType)],
  [
    ['log', 'file'],
    createFunctionType('logfile', noneType, stringType, stringType),
  ],
  [
    ['look', 'dir', 'up'],
    createFunctionType('lookdirup', directionType, vectorType, vectorType),
  ],
  [
    ['make', 'builtin', 'delegate'],
    createFunctionType('makebuiltindelegate', builtInDelegateType, stringType),
  ],
  [['max'], createFunctionType('max', scalarType, scalarType, scalarType)],
  [['min'], createFunctionType('min', scalarType, scalarType, scalarType)],
  [['mod'], createFunctionType('mod', scalarType, scalarType, scalarType)],
  [
    ['move', 'path'],
    createFunctionType(
      'movepath',
      noneType,
      createUnion(true, integerType, noneType),
      createUnion(true, integerType, noneType),
    ),
  ],
  [
    ['node'],
    createFunctionType(
      'node',
      nodeType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
    ),
  ],
  [
    ['note'],
    createFunctionType(
      'note',
      noteType,
      scalarType,
      scalarType,
      createUnion(true, scalarType, noneType),
      createUnion(true, scalarType, noneType),
    ),
  ],
  [['open'], createFunctionType('open', volumeItemType, stringType)],
  [
    ['orbit', 'at'],
    createFunctionType('orbitat', orbitInfoType, orbitableType, timeSpanType),
  ],
  [
    ['path'],
    createFunctionType(
      'path',
      pathType,
      createUnion(true, stringType, pathType, noneType),
    ),
  ],
  [
    ['pid', 'loop'],
    createFunctionType(
      'pidloop',
      pidLoopType,
      createUnion(true, scalarType, noneType),
      createUnion(true, scalarType, noneType),
      createUnion(true, scalarType, noneType),
      createUnion(true, scalarType, noneType),
      createUnion(true, scalarType, noneType),
    ),
  ],
  [
    ['position', 'at'],
    createFunctionType('positionat', vectorType, orbitableType, timeSpanType),
  ],
  [['print'], createFunctionType('print', noneType, structureType)],
  [
    ['print', 'at'],
    createFunctionType(
      'printat',
      noneType,
      structureType,
      scalarType,
      scalarType,
    ),
  ],
  [['print', 'list'], createFunctionType('printlist', noneType, stringType)],
  [
    ['processor'],
    createFunctionType(
      'processor',
      kosProcessorFieldsType,
      createUnion(true, stringType, volumeType),
    ),
  ],
  [['profile', 'result'], createFunctionType('profileresult', stringType)],
  [
    ['q'],
    createFunctionType(
      'q',
      directionType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
    ),
  ],
  [
    ['queue'],
    createVarFunctionType(
      'queue',
      queueType.apply(structureType),
      createVarType(structureType),
    ),
  ],
  [
    ['r'],
    createFunctionType('r', directionType, scalarType, scalarType, scalarType),
  ],
  [['random'], createFunctionType('random', scalarType)],
  [
    ['range'],
    createFunctionType(
      'range',
      rangeType,
      integerType,
      createUnion(true, integerType, noneType),
      createUnion(true, integerType, noneType),
    ),
  ],
  [
    ['read', 'json'],
    createFunctionType(
      'readjson',
      serializableType,
      createUnion(true, stringType, pathType),
    ),
  ],
  [['reboot'], createFunctionType('reboot', noneType)],
  [['remove'], createFunctionType('remove', noneType, nodeType)],
  [
    ['rgb'],
    createFunctionType('rgb', rgbaType, scalarType, scalarType, scalarType),
  ],
  [
    ['rgba'],
    createFunctionType(
      'rgba',
      rgbaType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
    ),
  ],
  [
    ['rotate', 'from', 'to'],
    createFunctionType('rotatefromto', directionType, vectorType, vectorType),
  ],
  [
    ['round'],
    createFunctionType(
      'round',
      scalarType,
      scalarType,
      createUnion(true, scalarType, noneType),
    ),
  ],
  [['script', 'path'], createFunctionType('scriptpath', pathType)],
  [
    ['select', 'auto', 'pilot', 'mode'],
    createFunctionType('selectautopilotmode', noneType, stringType),
  ],
  [['shutdown'], createFunctionType('shutdown', noneType)],
  [['sin'], createFunctionType('sin', doubleType, scalarType)],
  [
    ['slide', 'note'],
    createFunctionType(
      'slidenote',
      noteType,
      scalarType,
      scalarType,
      scalarType,
      createUnion(true, scalarType, noneType),
      createUnion(true, scalarType, noneType),
    ),
  ],
  [['sqrt'], createFunctionType('sqrt', scalarType, scalarType)],
  [
    ['stack'],
    createVarFunctionType(
      'stack',
      stackType.apply(structureType),
      createVarType(structureType),
    ),
  ],
  [['stage'], createFunctionType('stage', noneType)],
  [['stop', 'all', 'voices'], createFunctionType('stopallvoices', noneType)],
  [
    ['switch'],
    createFunctionType(
      'switch',
      noneType,
      createUnion(true, volumeType, stringType),
    ),
  ],
  [['tan'], createFunctionType('tan', scalarType, scalarType)],
  [
    ['toggle', 'fly', 'by', 'wire'],
    createFunctionType('toggleflybywire', noneType, stringType, booleanType),
  ],
  [
    ['transfer'],
    createFunctionType(
      'transfer',
      resourceTransferType,
      stringType,
      structureType,
      structureType,
      scalarType,
    ),
  ],
  [
    ['transfer', 'all'],
    createFunctionType(
      'transferall',
      resourceTransferType,
      stringType,
      structureType,
      structureType,
    ),
  ],
  [['unchar'], createFunctionType('unchar', scalarType, stringType)],
  [
    ['unique', 'set'],
    createVarFunctionType(
      'uniqueset',
      uniqueSetType.apply(structureType),
      createVarType(structureType),
    ),
  ],
  [
    ['v'],
    createFunctionType('v', vectorType, scalarType, scalarType, scalarType),
  ],
  [
    ['v', 'ang'],
    createFunctionType('vang', scalarType, vectorType, vectorType),
  ],
  [
    ['v', 'crs'],
    createFunctionType('vcrs', vectorType, vectorType, vectorType),
  ],
  [
    ['v', 'dot'],
    createFunctionType('vdot', scalarType, vectorType, vectorType),
  ],
  [
    ['vec', 'draw'],
    createFunctionType(
      'vecdraw',
      vectorRendererType,
      createUnion(true, vectorType, delegateType, noneType),
      createUnion(true, vectorType, delegateType, noneType),
      createUnion(true, rgbaType, delegateType, noneType),
      createUnion(true, stringType, noneType),
      createUnion(true, scalarType, noneType),
      createUnion(true, booleanType, noneType),
      createUnion(true, scalarType, noneType),
      createUnion(true, booleanType, noneType),
      createUnion(true, booleanType, noneType),
    ),
  ],
  [
    ['vec', 'draw', 'args'],
    createFunctionType(
      'vecdrawargs',
      vectorRendererType,
      createUnion(true, vectorType, delegateType, noneType),
      createUnion(true, vectorType, delegateType, noneType),
      createUnion(true, rgbaType, delegateType, noneType),
      createUnion(true, stringType, noneType),
      createUnion(true, scalarType, noneType),
      createUnion(true, booleanType, noneType),
      createUnion(true, scalarType, noneType),
      createUnion(true, booleanType, noneType),
      createUnion(true, booleanType, noneType),
    ),
  ],
  [
    ['vector', 'angle'],
    createFunctionType('vectorangle', scalarType, vectorType, vectorType),
  ],
  [
    ['vector', 'cross', 'product'],
    createFunctionType(
      'vectorcrossproduct',
      vectorType,
      vectorType,
      vectorType,
    ),
  ],
  [
    ['vector', 'dot', 'product'],
    createFunctionType('vectordotproduct', vectorType, vectorType, vectorType),
  ],
  [
    ['vector', 'exclude'],
    createFunctionType('vectorexclude', vectorType, vectorType, vectorType),
  ],
  [
    ['velocity', 'at'],
    createFunctionType(
      'velocityat',
      orbitableVelocityType,
      orbitableType,
      timeSpanType,
    ),
  ],
  [['vessel'], createFunctionType('vessel', vesselTargetType, stringType)],
  [
    ['volume'],
    createFunctionType(
      'volume',
      volumeType,
      createUnion(true, pathType, stringType),
    ),
  ],
  [['vxcl'], createFunctionType('vxcl', vectorType, vectorType, vectorType)],
  [['warp', 'to'], createFunctionType('warpto', noneType, scalarType)],
  [['waypoint'], createFunctionType('waypoint', waypointType, stringType)],
  [
    ['write', 'json'],
    createFunctionType(
      'writejson',
      volumeFileType,
      serializableType,
      createUnion(true, stringType, pathType),
    ),
  ],
];

const locks: [string[], IType][] = [
  [['throttle'], scalarType],
  [['steering'], directionType],
  [['wheel', 'throttle'], scalarType],
  [['wheel', 'steering'], directionType],
  [['sas', 'mode'], stringType],
  [['nav', 'mode'], stringType],
];

const variables: [string[], IType][] = [
  [['abort'], booleanType],
  [['active', 'ship'], vesselTargetType],
  [['addons'], addonListType],
  [['ag1'], booleanType],
  [['ag10'], booleanType],
  [['ag2'], booleanType],
  [['ag3'], booleanType],
  [['ag4'], booleanType],
  [['ag5'], booleanType],
  [['ag6'], booleanType],
  [['ag7'], booleanType],
  [['ag8'], booleanType],
  [['ag9'], booleanType],
  [['airspeed'], scalarType],
  [['all', 'nodes'], listType.apply(nodeType)],
  [['alt'], vesselAltType],
  [['altitude'], scalarType],
  [['angular', 'momentum'], vectorType],
  [['angular', 'vel'], vectorType],
  [['angular', 'velocity'], vectorType],
  [['apoapsis'], scalarType],
  [['archive'], volumeType],
  [['available', 'thrust'], scalarType],
  [['bays'], booleanType],
  [['black'], rgbaType],
  [['blue'], rgbaType],
  [['body'], bodyTargetType],
  [['brakes'], booleanType],
  [['chutes'], booleanType],
  [['chutes', 'safe'], booleanType],
  [['config'], configType],
  [['constant'], constantType],
  [['control', 'connection'], controlConnectionType],
  [['core'], coreType],
  [['cyan'], rgbaType],
  [['deploy', 'drills'], booleanType],
  [['donothing'], delegateType],
  [['drills'], booleanType],
  [['encounter'], createUnion(false, orbitInfoType, stringType)],
  [['eta'], vesselEtaType],
  [['facing'], directionType],
  [['fuel', 'cells'], booleanType],
  [['gear'], booleanType],
  [['geo', 'position'], geoCoordinatesType],
  [['gray'], rgbaType],
  [['green'], rgbaType],
  [['grey'], rgbaType],
  [['has', 'node'], booleanType],
  [['has', 'target'], booleanType],
  [['heading'], scalarType],
  [['home', 'connection'], homeConnectionType],
  [['intakes'], booleanType],
  [['isru'], booleanType],
  [['kuniverse'], kUniverseType],
  [['ladders'], booleanType],
  [['latitude'], scalarType],
  [['legs'], booleanType],
  [['lights'], booleanType],
  [['longitude'], scalarType],
  [['magenta'], rgbaType],
  [['map', 'view'], booleanType],
  [['mass'], scalarType],
  [['max', 'thrust'], scalarType],
  [['mission', 'time'], scalarType],
  [['next', 'node'], nodeType],
  [['north'], directionType],
  [['obt'], orbitInfoType],
  [['orbit'], orbitInfoType],
  [['panels'], booleanType],
  [['periapsis'], scalarType],
  [['prograde'], directionType],
  [['purple'], rgbaType],
  [['radiators'], booleanType],
  [['rcs'], booleanType],
  [['red'], rgbaType],
  [['retrograde'], directionType],
  [['sas'], booleanType],
  [['sensor'], vesselSensorsType],
  [['session', 'time'], doubleType],
  [['ship'], vesselTargetType],
  [['ship', 'name'], stringType],
  [['solar', 'prime', 'vector'], vectorType],
  [['srf', 'prograde'], directionType],
  [['srf', 'retrograde'], directionType],
  [['stage'], stageType],
  [['status'], stringType],
  [['steering', 'manager'], steeringManagerType],
  [['surface', 'speed'], scalarType],
  [['target'], createUnion(false, bodyTargetType, vesselTargetType, partType)],
  [['terminal'], terminalStructType],
  [['time'], timeSpanType],
  [['up'], directionType],
  [['velocity'], orbitableType],
  [['version'], versionInfoType],
  [['vertical', 'speed'], scalarType],
  [['volume:name'], stringType],
  [['warp'], integerType],
  [['warpmode'], stringType],
  [['white'], rgbaType],
  [['yellow'], rgbaType],
];

export const standardLibraryBuilder = (caseKind: CaseKind): SymbolTable => {
  const libraryBuilder = new SymbolTableBuilder(builtIn);

  for (const [segements, functionType] of functionTypes) {
    const callSignature = functionType.callSignature();

    const parameterCount = empty(callSignature)
      ? -1
      : callSignature.params.length;

    libraryBuilder.declareFunction(
      ScopeKind.global,
      new Token(
        TokenType.identifier,
        toCase(caseKind, ...segements),
        undefined,
        new Marker(0, 0),
        new Marker(0, 0),
        builtIn,
      ),
      parameterCount,
      0,
      false,
      functionType,
    );
  }

  for (const [segements, type] of variables) {
    libraryBuilder.declareVariable(
      ScopeKind.global,
      new Token(
        TokenType.identifier,
        toCase(caseKind, ...segements),
        undefined,
        new Marker(0, 0),
        new Marker(0, 0),
        builtIn,
      ),
      type,
    );
  }

  for (const [segment, type] of locks) {
    libraryBuilder.declareLock(
      ScopeKind.global,
      new Token(
        TokenType.identifier,
        toCase(caseKind, ...segment),
        undefined,
        new Marker(0, 0),
        new Marker(0, 0),
        builtIn,
      ),
      type,
    );
  }

  return libraryBuilder.build();
};

export const bodyLibraryBuilder = (
  caseKind: CaseKind,
  celetrialBodies = DEFAULT_BODIES,
): SymbolTable => {
  const bodyBuilder = new SymbolTableBuilder(builtIn);

  for (const identifier of celetrialBodies) {
    bodyBuilder.declareVariable(
      ScopeKind.global,
      new Token(
        TokenType.identifier,
        toCase(caseKind, identifier),
        undefined,
        new Marker(0, 0),
        new Marker(0, 0),
        builtIn,
      ),
      bodyTargetType,
    );
  }

  return bodyBuilder.build();
};
