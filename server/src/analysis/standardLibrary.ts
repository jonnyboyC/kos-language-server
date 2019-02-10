import { ScopeType } from '../parser/types';
import { Token, Marker } from '../entities/token';
import { TokenType } from '../entities/tokentypes';
import {
  scalarType, stringType,
  booleanType, integarType, doubleType,
} from '../typeChecker/types/primitives';
import { queueType } from '../typeChecker/types/collections/queue';
import { structureType, serializableStructureType } from '../typeChecker/types/structure';
import { createVarType } from '../typeChecker/types/typeUitlities';
import { userListType, listType } from '../typeChecker/types/collections/list';
import { stackType } from '../typeChecker/types/collections/stack';
import { uniqueSetType } from '../typeChecker/types/collections/uniqueset';
import { voidType } from '../typeChecker/types/void';
import { nodeType } from '../typeChecker/types/node';
import { partType } from '../typeChecker/types/part';
import { constantType } from '../typeChecker/types/constant';
import { pathType } from '../typeChecker/types/io/path';
import { volumeType } from '../typeChecker/types/io/volume';
import { vectorType } from '../typeChecker/types/collections/vector';
import { rgbaType } from '../typeChecker/types/rgba';
import { directionType } from '../typeChecker/types/direction';
import { kacAlarmType } from '../typeChecker/types/kacAlarmWrapper';
import { geoCoordinatesType } from '../typeChecker/types/geoCoordinates';
import { vesselTargetType } from '../typeChecker/types/orbital/vesselTarget';
import { bodyTargetType } from '../typeChecker/types/orbital/bodyTarget';
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
import { ScopeBuilder } from './scopeBuilder';
import { volumeFileType } from '../typeChecker/types/io/volumneFile';
import { pidLoopType } from '../typeChecker/types/pidLoop';
import { volumeItemType } from '../typeChecker/types/io/volumeItem';
import { volumeDirectoryType } from '../typeChecker/types/io/volumeDirectory';
import { createFunctionType, createVarFunctionType } from '../typeChecker/types/ksType';
import { IArgumentType } from '../typeChecker/types/types';
import { delegateType } from '../typeChecker/types/delegate';
import { kUniverseType } from '../typeChecker/types/kUniverse';
import { homeConnectionType } from '../typeChecker/types/communication/homeConnection';
import { controlConnectionType } from '../typeChecker/types/communication/controlConnection';

const libraryBuilder = new ScopeBuilder(builtIn);
const functionTypes = [
  createFunctionType('abs', scalarType, scalarType),
  createFunctionType('add', voidType, nodeType),
  createFunctionType('addAlarm', kacAlarmType, stringType, stringType, doubleType, stringType),
  createFunctionType('allwaypoints', listType.toConcreteType(waypointType)),
  createFunctionType('angleaxis', directionType, vectorType, doubleType),
  createFunctionType('anglediff', scalarType, scalarType, scalarType),
  createFunctionType('arccos', scalarType),
  createFunctionType('arcsin', scalarType),
  createFunctionType('arctan', scalarType),
  createFunctionType('arctan2', scalarType),
  createFunctionType('body', bodyTargetType, stringType),
  createFunctionType('bodyatmosphere', bodyAtmosphereType, stringType),
  createFunctionType('buildlist', /* TODO */ scalarType),
  createFunctionType('career', careerType),
  createFunctionType('cd', voidType, stringType),
  createFunctionType('ceiling', scalarType, scalarType),
  createFunctionType('char', stringType, scalarType),
  createFunctionType('chdir', voidType, stringType),
  createFunctionType('clearguis', voidType),
  createFunctionType('clearscreen', voidType),
  createFunctionType('clearvecdraws', voidType),
  createFunctionType('constant', constantType),
  createFunctionType('copypath', voidType, stringType, stringType),
  createFunctionType('cos', scalarType),
  createFunctionType('create', volumeFileType, stringType),
  createFunctionType('createdir', volumeDirectoryType, stringType),
  createFunctionType('debugdump', voidType),
  createFunctionType('debugfreezegame', scalarType),
  createFunctionType('deleteAlarm', booleanType, stringType),
  createFunctionType('deletepath', voidType, stringType, stringType),
  createFunctionType('edit', voidType, pathType),
  createFunctionType('exists', booleanType, stringType),
  createFunctionType('floor', scalarType, scalarType),
  createFunctionType('GetVoice', voiceType, integarType),
  createFunctionType('gui', guiWidgetType, integarType, integarType),
  createFunctionType('heading', directionType, doubleType, doubleType),
  createFunctionType('highlight', highlightType, structureType, rgbaType),
  createFunctionType('hsv', hsvaType, doubleType, doubleType, doubleType),
  createFunctionType('hsva', hsvaType, doubleType, doubleType, doubleType, doubleType),
  createFunctionType(
    'hudtext', voidType, stringType, integarType,
    integarType, /* TODO */scalarType, booleanType),
  createFunctionType('latlng', geoCoordinatesType, doubleType, doubleType),
  createVarFunctionType('lex', lexiconType, createVarType(structureType)),
  createVarFunctionType('lexicon', lexiconType, createVarType(structureType)),
  createVarFunctionType('list', userListType, createVarType(structureType)),
  createFunctionType('listAlarms', listType.toConcreteType(kacAlarmType), stringType),
  createFunctionType('ln', scalarType, scalarType),
  createFunctionType('log10', scalarType, scalarType),
  createFunctionType('logfile', voidType, stringType, stringType),
  createFunctionType('lookdirup', directionType, vectorType, vectorType),
  createFunctionType('makebuiltindelegate', /* TODO */ scalarType, stringType),
  createFunctionType('max', scalarType, scalarType, scalarType),
  createFunctionType('min', scalarType, scalarType, scalarType),
  createFunctionType('mod', scalarType, scalarType),
  createFunctionType('movepath', voidType, stringType, stringType),
  createFunctionType('node', nodeType, doubleType, doubleType, doubleType, doubleType),
  createFunctionType('note', noteType, doubleType, doubleType, doubleType, doubleType),
  createFunctionType('open', volumeItemType, stringType),
  createFunctionType('orbitat', orbitInfoType, orbitableType, timeSpanType),
  createFunctionType('path', pathType, stringType),
  createFunctionType(
    'pidloop', pidLoopType, scalarType,
    scalarType, scalarType, scalarType, scalarType),
  createFunctionType('positionat', vectorType, orbitableType, timeSpanType),
  createFunctionType('print', structureType),
  createFunctionType('printat', structureType, scalarType, scalarType),
  createFunctionType('printlist', voidType, stringType),
  createFunctionType('processor', partType, /* TODO Union Type */ stringType),
  createFunctionType('profileresult', voidType),
  createFunctionType('q', directionType, doubleType, doubleType, doubleType, doubleType),
  createVarFunctionType(
    'queue', queueType.toConcreteType(structureType), createVarType(structureType)),
  createFunctionType('r', directionType, doubleType, doubleType, doubleType),
  createFunctionType('random', scalarType),
  createFunctionType('range', rangeType, integarType, integarType, integarType),
  createFunctionType('readjson', serializableStructureType, stringType),
  createFunctionType('reboot', voidType),
  createFunctionType('remove', voidType, nodeType),
  createFunctionType('rgb', rgbaType, doubleType, doubleType, doubleType),
  createFunctionType('rgba', rgbaType, doubleType, doubleType, doubleType, doubleType),
  createFunctionType('rotatefromto', directionType, vectorType, vectorType),
  createFunctionType('round', scalarType, scalarType),
  createFunctionType('scriptpath', pathType),
  createFunctionType('selectautopilotmode', voidType, stringType),
  createFunctionType('shutdown', voidType),
  createFunctionType('sin', scalarType),
  createFunctionType(
    'slidenote', noteType, doubleType,
    doubleType, doubleType, doubleType, doubleType),
  createFunctionType('sqrt', scalarType, scalarType),
  createVarFunctionType(
    'stack', stackType.toConcreteType(structureType), createVarType(structureType)),
  createFunctionType('stage', voidType),
  createFunctionType('StopAllVoices', voidType),
  createFunctionType('switch', stringType),
  createFunctionType('tan', scalarType),
  createFunctionType('toggleflybywire', voidType, stringType, booleanType),
  createFunctionType(
    'transfer', resourceTransferType,
    stringType, structureType, structureType,  doubleType),
  createFunctionType(
    'transferall', resourceTransferType,
    stringType, structureType, structureType),
  createFunctionType('unchar', scalarType, stringType),
  createVarFunctionType(
    'uniqueset', uniqueSetType.toConcreteType(structureType), createVarType(structureType)),
  createFunctionType('v', vectorType, doubleType, doubleType, doubleType),
  createFunctionType('vang', vectorType, vectorType, vectorType),
  createFunctionType('vcrs', vectorType, vectorType, vectorType),
  createFunctionType('vdot', vectorType, vectorType, vectorType),
  createFunctionType(
    'vecdraw', vectorRendererType, vectorType, vectorType, rgbaType,
    stringType, doubleType, booleanType, doubleType),
  createFunctionType(
    'vecdrawargs', vectorRendererType, vectorType, vectorType, rgbaType,
    stringType, doubleType, booleanType, doubleType),
  createFunctionType('vectorangle', scalarType, vectorType, vectorType),
  createFunctionType('vectorcrossproduct', vectorType, vectorType, vectorType),
  createFunctionType('vectordotproduct', vectorType, vectorType, vectorType),
  createFunctionType('vectorexclude', vectorType, vectorType, vectorType),
  createFunctionType('velocityat', vectorType, orbitableType, timeSpanType),
  createFunctionType('vessel', vesselTargetType, stringType),
  createFunctionType('volume', volumeType, stringType),
  createFunctionType('vxcl', vectorType, vectorType, vectorType),
  createFunctionType('warpto', voidType, doubleType),
  createFunctionType('waypoint', waypointType, stringType),
  createFunctionType('writejson', volumeFileType, serializableStructureType, stringType),
];

// createFunctionType('rename_file_deprecated', /* TODO */ scalarType),
// createFunctionType('rename_volume_deprecated', /* TODO */ scalarType),
// createFunctionType('copy_deprecated', /* TODO */ scalarType),
// createFunctionType('delete_deprecated', /* TODO */ scalarType),
// createFunctionType('run', /* TODO */ scalarType),

const locks: [string, IArgumentType][] = [
  ['throttle', scalarType],
  ['steering', directionType],
  ['wheelthrottle', scalarType],
  ['wheelsteering', directionType],
  ['sasMode', stringType],
  ['navMode', stringType],
];

const variables: [string, IArgumentType][] = [
  ['abort', structureType], // TODO
  ['activeship', structureType], // TODO
  ['addons', structureType], // TODO
  ['ag1', structureType], // TODO
  ['ag10', structureType], // TODO
  ['ag2', structureType], // TODO
  ['ag3', structureType], // TODO
  ['ag4', structureType], // TODO
  ['ag5', structureType], // TODO
  ['ag6', structureType], // TODO
  ['ag7', structureType], // TODO
  ['ag8', structureType], // TODO
  ['ag9', structureType], // TODO
  ['airspeed', structureType], // TODO
  ['allnodes', structureType], // TODO
  ['alt', structureType], // TODO
  ['altitude', structureType], // TODO
  ['angularmomentum', vectorType], // TODO
  ['angularvel', structureType], // TODO
  ['angularvelocity', structureType], // TODO
  ['apoapsis', structureType], // TODO
  ['archive', structureType], // TODO
  ['availablethrust', structureType], // TODO
  ['bays', structureType], // TODO
  ['black', rgbaType],
  ['blue', structureType],
  ['body', structureType], // TODO
  ['brakes', structureType], // TODO
  ['chutes', structureType], // TODO
  ['chutessafe', structureType], // TODO
  ['config', structureType], // TODO
  ['constant', constantType],
  ['controlconnection', controlConnectionType],
  ['core', structureType], // TODO
  ['cyan', structureType], // TODO
  ['deploydrills', structureType], // TODO
  ['donothing', delegateType], // TODO
  ['drills', structureType], // TODO
  ['encounter', structureType], // TODO
  ['eta', structureType], // TODO
  ['facing', structureType], // TODO
  ['fuelcells', structureType], // TODO
  ['gear', structureType], // TODO
  ['geoposition', structureType], // TODO
  ['gray', rgbaType],
  ['green', rgbaType],
  ['grey', rgbaType],
  ['groundspeed', structureType], // TODO
  ['hasnode', structureType], // TODO
  ['hastarget', structureType], // TODO
  ['heading', scalarType], // TODO
  ['homeconnection', homeConnectionType],
  ['intakes', structureType], // TODO
  ['isru', structureType], // TODO
  ['kuniverse', kUniverseType], // TODO
  ['ladders', structureType], // TODO
  ['latitude', structureType], // TODO
  ['legs', structureType], // TODO
  ['lights', structureType], // TODO
  ['longitude', structureType], // TODO
  ['magenta', rgbaType],
  ['mapview', structureType], // TODO
  ['mass', structureType], // TODO
  ['maxthrust', structureType], // TODO
  ['missiontime', structureType], // TODO
  ['nextnode', structureType], // TODO
  ['north', structureType], // TODO
  ['obt', structureType], // TODO
  ['orbit', structureType], // TODO
  ['panels', structureType], // TODO
  ['periapsis', structureType], // TODO
  ['prograde', directionType], // TODO
  ['purple', rgbaType],
  ['radiators', structureType], // TODO
  ['rcs', structureType], // TODO
  ['red', structureType],
  ['retrograde', structureType], // TODO
  ['sas', structureType], // TODO
  ['sensor', structureType], // TODO
  ['sessiontime', structureType], // TODO
  ['ship', structureType], // TODO
  ['shipname', structureType], // TODO
  ['solarprimevector', vectorType],
  ['srfprograde', directionType], // TODO
  ['srfretrograde', directionType], // TODO
  ['stage', structureType], // TODO
  ['status', structureType], // TODO
  ['steeringmanager', structureType], // TODO
  ['surfacespeed', structureType], // TODO
  ['target', structureType], // TODO
  ['terminal', structureType], // TODO
  ['time', structureType], // TODO
  ['up', structureType], // TODO
  ['velocity', structureType], // TODO
  ['version', structureType], // TODO
  ['verticalspeed', structureType], // TODO
  ['volume:name', structureType], // TODO
  ['warp', structureType], // TODO
  ['warpmode', structureType], // TODO
  ['white', rgbaType],
  ['yellow', rgbaType],
];

for (const functionType of functionTypes) {
  libraryBuilder.declareFunction(
    ScopeType.global,
    new Token(
      TokenType.identifier,
      functionType.name,
      undefined,
      new Marker(0, 0),
      new Marker(0, 0),
      builtIn,
    ),
    [],
    false,
    functionType);
}

for (const variable of variables) {
  libraryBuilder.declareVariable(
    ScopeType.global,
    new Token(
      TokenType.identifier,
      variable,
      undefined,
      new Marker(0, 0),
      new Marker(0, 0),
      builtIn,
    ));
}

for (const [identifier, type] of locks) {
  libraryBuilder.declareLock(
    ScopeType.global,
    new Token(
      TokenType.identifier,
      identifier,
      undefined,
      new Marker(0, 0),
      new Marker(0, 0),
      builtIn,
    ),
    type);
}

export const standardLibrary = libraryBuilder.build();
