import { ScopeKind } from '../parser/types';
import { Token } from '../entities/token';
import { TokenType } from '../entities/tokentypes';
import { queueType } from '../typeChecker/types/collections/queue';
import { structureType } from '../typeChecker/types/primitives/structure';
import { listType } from '../typeChecker/types/collections/list';
import { stackType } from '../typeChecker/types/collections/stack';
import { uniqueSetType } from '../typeChecker/types/collections/uniqueset';
import { nodeType } from '../typeChecker/types/node';
import { partType } from '../typeChecker/types/parts/part';
import { constantType } from '../typeChecker/types/constant';
import { pathType } from '../typeChecker/types/io/path';
import { volumeType } from '../typeChecker/types/io/volume';
import { vectorType } from '../typeChecker/types/collections/vector';
import { rgbaType } from '../typeChecker/types/rgba';
import { directionType } from '../typeChecker/types/direction';
import { kacAlarmType } from '../typeChecker/types/kacAlarmWrapper';
import { geoCoordinatesType } from '../typeChecker/types/geoCoordinates';
import { bodyAtmosphereType } from '../typeChecker/types/bodyatmosphere';
import { noteType } from '../typeChecker/types/note';
import { voiceType } from '../typeChecker/types/voice';
import { hsvaType } from '../typeChecker/types/hsva';
import { vectorRendererType } from '../typeChecker/types/vectorRenderer';
import { guiWidgetType } from '../typeChecker/types/gui/guiWidget';
import { orbitableType } from '../typeChecker/types/orbital/orbitable';
import { timeSpanType } from '../typeChecker/types/timespan';
import { highlightType } from '../typeChecker/types/highlight';
import { orbitInfoType } from '../typeChecker/types/orbitInfo';
import { careerType } from '../typeChecker/types/career';
import { waypointType } from '../typeChecker/types/waypoint';
import { resourceTransferType } from '../typeChecker/types/resourceTransfer';
import { builtIn } from '../utilities/constants';
import { lexiconType } from '../typeChecker/types/collections/lexicon';
import { rangeType } from '../typeChecker/types/collections/range';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { volumeFileType } from '../typeChecker/types/io/volumneFile';
import { pidLoopType } from '../typeChecker/types/pidLoop';
import { volumeItemType } from '../typeChecker/types/io/volumeItem';
import { volumeDirectoryType } from '../typeChecker/types/io/volumeDirectory';
import {
  createFunctionType,
  createVarFunctionType,
  createVarType,
} from '../typeChecker/typeCreators';
import { delegateType } from '../typeChecker/types/primitives/delegate';
import { kUniverseType } from '../typeChecker/types/kUniverse';
import { homeConnectionType } from '../typeChecker/types/communication/homeConnection';
import { controlConnectionType } from '../typeChecker/types/communication/controlConnection';
import { vesselAltType } from '../typeChecker/types/vessel/vesselAlt';
import { vesselEtaType } from '../typeChecker/types/vessel/vesselEta';
import { stageType } from '../typeChecker/types/vessel/stage';
import { steeringManagerType } from '../typeChecker/types/steeringManager';
import { terminalStructType } from '../typeChecker/types/terminalStruct';
import { voidType } from '../typeChecker/types/primitives/void';
import { userListType } from '../typeChecker/types/collections/userList';
import {
  scalarType,
  doubleType,
  integerType,
} from '../typeChecker/types/primitives/scalar';
import { stringType } from '../typeChecker/types/primitives/string';
import { booleanType } from '../typeChecker/types/primitives/boolean';
import { coreType } from '../typeChecker/types/core';
import { versionInfoType } from '../typeChecker/types/versionInfo';
import { configType } from '../typeChecker/types/config';
import { builtInDelegateType } from '../typeChecker/types/primitives/builtInDelegate';
import { addonListType } from '../typeChecker/types/addon/addonList';
import { vesselSensorsType } from '../typeChecker/types/vessel/vesselSensors';
import { serializableStructureType } from '../typeChecker/types/primitives/serializeableStructure';
import { bodyTargetType } from '../typeChecker/types/orbital/bodyTarget';
import { vesselTargetType } from '../typeChecker/types/orbital/vesselTarget';
import { SymbolTable } from './symbolTable';
import { toCase } from '../utilities/stringUtils';
import { Marker } from '../entities/marker';
import { boundsType } from '../typeChecker/types/parts/bounds';
import { IType } from '../typeChecker/types';
import { empty } from '../utilities/typeGuards';

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
    createFunctionType('allwaypoints', listType.toConcreteType(waypointType)),
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
    createFunctionType(
      'listAlarms',
      listType.toConcreteType(kacAlarmType),
      stringType,
    ),
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
    createFunctionType('processor', partType, /* TODO Union Type */ stringType),
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
      queueType.toConcreteType(structureType),
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
    createFunctionType('readjson', serializableStructureType, stringType),
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
      stackType.toConcreteType(structureType),
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
      uniqueSetType.toConcreteType(structureType),
      createVarType(structureType),
    ),
  ],
  [
    ['v'],
    createFunctionType('v', vectorType, scalarType, scalarType, scalarType),
  ],
  [
    ['v', 'ang'],
    createFunctionType('vang', vectorType, vectorType, vectorType),
  ],
  [
    ['v', 'crs'],
    createFunctionType('vcrs', vectorType, vectorType, vectorType),
  ],
  [
    ['v', 'dot'],
    createFunctionType('vdot', vectorType, vectorType, vectorType),
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
  // TODO Union Types
  [
    ['write', 'json'],
    createFunctionType(
      'writejson',
      volumeFileType,
      serializableStructureType,
      stringType,
    ),
  ],
];

// createFunctionType('rename_file_deprecated', /* TODO */ scalarType),
// createFunctionType('rename_volume_deprecated', /* TODO */ scalarType),
// createFunctionType('copy_deprecated', /* TODO */ scalarType),
// createFunctionType('delete_deprecated', /* TODO */ scalarType),
// createFunctionType('run', /* TODO */ scalarType),

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
  [['all', 'nodes'], listType.toConcreteType(nodeType)],
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
  [['config'], configType], // TODO
  [['constant'], constantType],
  [['control', 'connection'], controlConnectionType],
  [['core'], coreType],
  [['cyan'], rgbaType],
  [['deploy', 'drills'], booleanType],
  [['donothing'], delegateType],
  [['drills'], booleanType],
  [['encounter'], orbitInfoType], // TODO Union
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
  [['map', 'view'], booleanType], // TODO
  [['mass'], scalarType],
  [['max', 'thrust'], scalarType],
  [['mission', 'time'], scalarType], // TODO
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
  [['target'], orbitableType], // TODO Union
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
    const parameterCount = empty(functionType.callSignature)
      ? -1
      : functionType.callSignature.params.length;

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
