import { ScopeType } from '../parser/types';
import { Token, Marker } from '../entities/token';
import { TokenType } from '../entities/tokentypes';
import { queueType } from '../typeChecker/types/collections/queue';
import {
  structureType, serializableStructureType,
} from '../typeChecker/types/primitives/structure';
import { createVarType } from '../typeChecker/typeUitlities';
import { listType } from '../typeChecker/types/collections/list';
import { stackType } from '../typeChecker/types/collections/stack';
import { uniqueSetType } from '../typeChecker/types/collections/uniqueset';
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
import { scalarType, doubleType, integarType } from '../typeChecker/types/primitives/scalar';
import { stringType } from '../typeChecker/types/primitives/string';
import { booleanType } from '../typeChecker/types/primitives/boolean';
import { coreType } from '../typeChecker/types/core';
import { versionInfoType } from '../typeChecker/types/versionInfo';
import { configType } from '../typeChecker/types/config';

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
  createFunctionType('print', voidType, structureType),
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
  ['activeship', vesselTargetType],
  ['addons', structureType], // TODO
  ['ag1', booleanType], // TODO
  ['ag10', booleanType], // TODO
  ['ag2', booleanType], // TODO
  ['ag3', booleanType], // TODO
  ['ag4', booleanType], // TODO
  ['ag5', booleanType], // TODO
  ['ag6', booleanType], // TODO
  ['ag7', booleanType], // TODO
  ['ag8', booleanType], // TODO
  ['ag9', booleanType], // TODO
  ['airspeed', scalarType],
  ['allnodes', listType.toConcreteType(nodeType)],
  ['alt', vesselAltType],
  ['altitude', scalarType],
  ['angularmomentum', vectorType],
  ['angularvel', vectorType],
  ['angularvelocity', vectorType],
  ['apoapsis', scalarType],
  ['archive', volumeType],
  ['availablethrust', structureType], // TODO
  ['bays', booleanType], // TODO
  ['black', rgbaType],
  ['blue', rgbaType],
  ['body', bodyTargetType],
  ['brakes', structureType], // TODO
  ['chutes', booleanType],
  ['chutessafe', booleanType],
  ['config', configType], // TODO
  ['constant', constantType],
  ['controlconnection', controlConnectionType],
  ['core', coreType],
  ['cyan', rgbaType],
  ['deploydrills', booleanType],
  ['donothing', delegateType],
  ['drills', booleanType],
  ['encounter', orbitInfoType], // TODO Union
  ['eta', vesselEtaType],
  ['facing', directionType],
  ['fuelcells', booleanType],
  ['gear', booleanType], // TODO
  ['geoposition', geoCoordinatesType],
  ['gray', rgbaType],
  ['green', rgbaType],
  ['grey', rgbaType],
  ['hasnode', booleanType],
  ['hastarget', booleanType],
  ['heading', scalarType],
  ['homeconnection', homeConnectionType],
  ['intakes', booleanType],
  ['isru', booleanType],
  ['kuniverse', kUniverseType],
  ['ladders', booleanType],
  ['latitude', scalarType],
  ['legs', booleanType],
  ['lights', booleanType], // TODO
  ['longitude', scalarType],
  ['magenta', rgbaType],
  ['mapview', booleanType], // TODO
  ['mass', scalarType],
  ['maxthrust', scalarType],
  ['missiontime', scalarType], // TODO
  ['nextnode', nodeType],
  ['north', directionType],
  ['obt', orbitInfoType],
  ['orbit', orbitInfoType],
  ['panels', booleanType],
  ['periapsis', scalarType],
  ['prograde', directionType],
  ['purple', rgbaType],
  ['radiators', booleanType],
  ['rcs', booleanType], // TODO
  ['red', rgbaType],
  ['retrograde', directionType],
  ['sas', booleanType], // TODO
  ['sensor', vesselTargetType], // TODO
  ['sessiontime', doubleType],
  ['ship', vesselTargetType],
  ['shipname', stringType],
  ['solarprimevector', vectorType],
  ['srfprograde', directionType],
  ['srfretrograde', directionType],
  ['stage', stageType],
  ['status', stringType],
  ['steeringmanager', steeringManagerType],
  ['surfacespeed', scalarType],
  ['target', structureType], // TODO Union
  ['terminal', terminalStructType],
  ['time', timeSpanType],
  ['up', directionType],
  ['velocity', orbitableType],
  ['version', versionInfoType],
  ['verticalspeed', scalarType],
  ['volume:name', stringType],
  ['warp', integarType],
  ['warpmode', stringType],
  ['white', rgbaType],
  ['yellow', rgbaType],
];

// obsoleted
//  ['groundspeed', scalarType],

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

for (const [identifier, type] of variables) {
  libraryBuilder.declareVariable(
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
