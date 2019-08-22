import { ScopeKind } from '../parser/types';
import { Token } from '../entities/token';
import { TokenType } from '../entities/tokentypes';
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
import { builtIn } from '../utilities/constants';
import { lexiconType } from '../typeChecker/ksTypes/collections/lexicon';
import { rangeType } from '../typeChecker/ksTypes/collections/range';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { volumeFileType } from '../typeChecker/ksTypes/io/volumneFile';
import { pidLoopType } from '../typeChecker/ksTypes/pidLoop';
import { volumeItemType } from '../typeChecker/ksTypes/io/volumeItem';
import { volumeDirectoryType } from '../typeChecker/ksTypes/io/volumeDirectory';
import {
  createFunctionType,
  createVarFunctionType,
  createVarType,
} from '../typeChecker/typeCreators';
import { delegateType } from '../typeChecker/ksTypes/primitives/delegate';
import { kUniverseType } from '../typeChecker/ksTypes/kUniverse';
import { homeConnectionType } from '../typeChecker/ksTypes/communication/homeConnection';
import { controlConnectionType } from '../typeChecker/ksTypes/communication/controlConnection';
import { vesselAltType } from '../typeChecker/ksTypes/vessel/vesselAlt';
import { vesselEtaType } from '../typeChecker/ksTypes/vessel/vesselEta';
import { stageType } from '../typeChecker/ksTypes/vessel/stage';
import { steeringManagerType } from '../typeChecker/ksTypes/steeringManager';
import { terminalStructType } from '../typeChecker/ksTypes/terminalStruct';
import { voidType } from '../typeChecker/ksTypes/primitives/void';
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
import { SymbolTable } from './symbolTable';
import { toCase } from '../utilities/stringUtils';
import { Marker } from '../entities/marker';
import { boundsType } from '../typeChecker/ksTypes/parts/bounds';
import { IType } from '../typeChecker/types';
import { empty } from '../utilities/typeGuards';
import { partModuleType } from '../typeChecker/ksTypes/parts/partModule';

const functionTypes: [string[], IType][] = [
  [['abs'], createFunctionType('abs', scalarType, scalarType)],
  [['add'], createFunctionType('add', voidType, nodeType)],
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
    createFunctionType('anglediff', scalarType, scalarType, scalarType),
  ],
  [['arc', 'cos'], createFunctionType('arccos', scalarType)],
  [['arc', 'sin'], createFunctionType('arcsin', scalarType)],
  [['arc', 'tan'], createFunctionType('arctan', scalarType)],
  [['arc', 'tan2'], createFunctionType('arctan2', scalarType)],
  // TODO need to figure out name collision for scope manager
  // createFunctionType('body', bodyTargetType, stringType)],
  [
    ['body', 'atmosphere'],
    createFunctionType('bodyatmosphere', bodyAtmosphereType, stringType),
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
    createFunctionType('buildlist', /* TODO Union */ scalarType, stringType),
  ],
  [['career'], createFunctionType('career', careerType)],
  [['cd'], createFunctionType('cd', voidType, stringType)],
  [['ceiling'], createFunctionType('ceiling', scalarType, scalarType)],
  [['char'], createFunctionType('char', stringType, scalarType)],
  [['chdir'], createFunctionType('chdir', voidType, stringType)],
  [['clear', 'guis'], createFunctionType('clearguis', voidType)],
  [['clear', 'screen'], createFunctionType('clearscreen', voidType)],
  [['clear', 'vec', 'draws'], createFunctionType('clearvecdraws', voidType)],
  [['constant'], createFunctionType('constant', constantType)],
  [
    ['copy', 'path'],
    createFunctionType('copypath', voidType, stringType, stringType),
  ],
  [['cos'], createFunctionType('cos', scalarType)],
  [['create'], createFunctionType('create', volumeFileType, stringType)],
  [
    ['create', 'dir'],
    createFunctionType('createdir', volumeDirectoryType, stringType),
  ],
  [['debug', 'dump'], createFunctionType('debugdump', voidType)],
  [
    ['debug', 'freeze', 'game'],
    createFunctionType('debugfreezegame', scalarType),
  ],
  [
    ['delete', 'alarm'],
    createFunctionType('deleteAlarm', booleanType, stringType),
  ],
  [
    ['delete', 'path'],
    createFunctionType('deletepath', voidType, stringType, stringType),
  ],
  [['edit'], createFunctionType('edit', voidType, pathType)],
  [['exists'], createFunctionType('exists', booleanType, stringType)],
  [['floor'], createFunctionType('floor', scalarType, scalarType)],
  [['get', 'voice'], createFunctionType('getvoice', voiceType, integerType)],
  [['gui'], createFunctionType('gui', guiWidgetType, integerType, integerType)],
  [
    ['heading'],
    createFunctionType('heading', directionType, scalarType, scalarType),
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
      voidType,
      stringType,
      integerType,
      integerType,
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
  [['ln'], createFunctionType('ln', scalarType, scalarType)],
  [['log10'], createFunctionType('log10', scalarType, scalarType)],
  [
    ['log', 'file'],
    createFunctionType('logfile', voidType, stringType, stringType),
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
    createFunctionType('movepath', voidType, stringType, stringType),
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
      scalarType,
      scalarType,
    ),
  ],
  [['open'], createFunctionType('open', volumeItemType, stringType)],
  [
    ['orbit', 'at'],
    createFunctionType('orbitat', orbitInfoType, orbitableType, timeSpanType),
  ],
  [['path'], createFunctionType('path', pathType, stringType)],
  [
    ['pid', 'loop'],
    createFunctionType(
      'pidloop',
      pidLoopType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
    ),
  ],
  [
    ['position', 'at'],
    createFunctionType('positionat', vectorType, orbitableType, timeSpanType),
  ],
  [['print'], createFunctionType('print', voidType, structureType)],
  [
    ['print', 'at'],
    createFunctionType('printat', structureType, scalarType, scalarType),
  ],
  [['print', 'list'], createFunctionType('printlist', voidType, stringType)],
  [
    ['processor'],
    createFunctionType(
      'processor',
      partModuleType,
      stringType /* TODO Union Type  string and volume */,
    ),
  ],
  [['profile', 'result'], createFunctionType('profileresult', voidType)],
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
      integerType,
      integerType,
    ),
  ],
  [
    ['read', 'json'],
    createFunctionType('readjson', serializableType, stringType),
  ], // TODO Union Types
  [['reboot'], createFunctionType('reboot', voidType)],
  [['remove'], createFunctionType('remove', voidType, nodeType)],
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
  [['round'], createFunctionType('round', scalarType, scalarType)],
  [['script', 'path'], createFunctionType('scriptpath', pathType)],
  [
    ['select', 'auto', 'pilot', 'mode'],
    createFunctionType('selectautopilotmode', voidType, stringType),
  ],
  [['shutdown'], createFunctionType('shutdown', voidType)],
  [['sin'], createFunctionType('sin', scalarType)],
  [
    ['slide', 'note'],
    createFunctionType(
      'slidenote',
      noteType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
      scalarType,
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
  [['stage'], createFunctionType('stage', voidType)],
  [['stop', 'all', 'voices'], createFunctionType('stopallvoices', voidType)],
  [['switch'], createFunctionType('switch', stringType)],
  [['tan'], createFunctionType('tan', scalarType)],
  [
    ['toggle', 'fly', 'by', 'wire'],
    createFunctionType('toggleflybywire', voidType, stringType, booleanType),
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
      vectorType,
      vectorType,
      rgbaType,
      stringType,
      scalarType,
      booleanType,
      scalarType,
    ),
  ],
  [
    ['vec', 'draw', 'args'],
    createFunctionType(
      'vecdrawargs',
      vectorRendererType,
      vectorType,
      vectorType,
      rgbaType,
      stringType,
      scalarType,
      booleanType,
      scalarType,
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
    createFunctionType('velocityat', vectorType, orbitableType, timeSpanType),
  ],
  [['vessel'], createFunctionType('vessel', vesselTargetType, stringType)],
  [['volume'], createFunctionType('volume', volumeType, stringType)],
  [['vxcl'], createFunctionType('vxcl', vectorType, vectorType, vectorType)],
  [['warp', 'to'], createFunctionType('warpto', voidType, scalarType)],
  [['waypoint'], createFunctionType('waypoint', waypointType, stringType)],
  // TODO Union Types string | path
  [
    ['write', 'json'],
    createFunctionType(
      'writejson',
      volumeFileType,
      serializableType,
      stringType,
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
  [['encounter'], orbitInfoType], // TODO Union orbitInfo | string
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
  [['target'], orbitableType], // TODO Union bodyTarget | vesselTarget | part
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

const bodies: [string, IType][] = [
  ['kerbol', bodyTargetType],
  ['moho', bodyTargetType],
  ['eve', bodyTargetType],
  ['gilly', bodyTargetType],
  ['kerbin', bodyTargetType],
  ['mun', bodyTargetType],
  ['minmus', bodyTargetType],
  ['duna', bodyTargetType],
  ['ike', bodyTargetType],
  ['dres', bodyTargetType],
  ['jool', bodyTargetType],
  ['laythe', bodyTargetType],
  ['vall', bodyTargetType],
  ['tylo', bodyTargetType],
  ['bop', bodyTargetType],
  ['pol', bodyTargetType],
  ['eeloo', bodyTargetType],
];

// obsoleted
//  ['groundspeed', scalarType],

export const standardLibraryBuilder = (caseKind: CaseKind): SymbolTable => {
  const libraryBuilder = new SymbolTableBuilder(builtIn);

  for (const [segements, functionType] of functionTypes) {
    const callSignature = functionType.getCallSignature();

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

export const bodyLibraryBuilder = (caseKind: CaseKind): SymbolTable => {
  const bodyBuilder = new SymbolTableBuilder(builtIn);

  for (const [identifier, type] of bodies) {
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
      type,
    );
  }

  return bodyBuilder.build();
};
