
/* import { queueType } from './collections/queue';
import { listType } from './collections/list';
import { stackType } from './collections/stack';
import { uniqueSetType } from './collections/uniqueset'; */
import { structureType } from './primitives/structure';
import { nodeType } from './node';
import { constantType } from './constant';
import { pathType } from './io/path';
import { volumeType } from './io/volume';
import { vectorType } from './collections/vector';
import { rgbaType } from './rgba';
import { directionType } from './collections/direction';
import { kacAlarmType } from './kacAlarmWrapper';
import { geoCoordinatesType } from './geoCoordinates';
import { bodyAtmosphereType } from './bodyatmosphere';
import { noteType } from './note';
import { voiceType } from './voice';
import { hsvaType } from './hsva';
import { vectorRendererType } from './vectorRenderer';
import { guiWidgetType } from './gui/guiWidget';
import { orbitableType } from './orbital/orbitable';
import { timeSpanType } from './timespan';
import { highlightType } from './highlight';
import { orbitInfoType } from './orbitInfo';
import { careerType } from './career';
import { waypointType } from './waypoint';
import { resourceTransferType } from './resourceTransfer';
import { lexiconType } from './collections/lexicon';
import { rangeType } from './collections/range';
import { volumeFileType } from './io/volumneFile';
import { pidLoopType } from './pidLoop';
import { volumeItemType } from './io/volumeItem';
import { volumeDirectoryType } from './io/volumeDirectory';
import { delegateType } from './primitives/delegate';
import { kUniverseType } from './kUniverse';
import { homeConnectionType } from './communication/homeConnection';
import { controlConnectionType } from './communication/controlConnection';
import { vesselAltType } from './vessel/vesselAlt';
import { vesselEtaType } from './vessel/vesselEta';
import { stageType } from './vessel/stage';
import { steeringManagerType } from './steeringManager';
import { terminalStructType } from './terminalStruct';
import { noneType } from './primitives/none';
import { userListType } from './collections/userList';
import {
  scalarType,
  doubleType,
  integerType,
} from './primitives/scalar';
import { stringType } from './primitives/string';
import { booleanType } from './primitives/boolean';
import { coreType } from './core';
import { versionInfoType } from './versionInfo';
import { configType } from './config';
import { builtInDelegateType } from './primitives/builtInDelegate';
import { addonListType } from './addon/addonList';
import { vesselSensorsType } from './vessel/vesselSensors';
import { serializableType } from './primitives/serializeableStructure';
import { bodyTargetType } from './orbital/bodyTarget';
import { vesselTargetType } from './orbital/vesselTarget';
import { boundsType } from './parts/bounds';
import { IType } from '../types';
import { Type } from '../models/types/type';
import { partType } from './parts/part';
import { kosProcessorFieldsType } from './kosProcessorFields';
import { orbitableVelocityType } from './orbitalVelocity';
import { aggregateResourceType } from './parts/aggregateResource';
import { elementType } from './parts/element';
import { engineType } from './parts/engine';
import { dockingPortType } from './parts/dockingPort';
import { scienceExperimentType } from './parts/scienceExperimentModule';
import { scienceDataType } from './scienceData';
import { listType } from './collections/list';
import { partModuleType } from './parts/partModule';

type ITypeMap = Map<string, IType|Type>;
export const TypeHint: ITypeMap = new Map([
//    ['', structureType],
    ['aggregateResource', aggregateResourceType],
    ['element', elementType],
    ['kosProcessorFields', kosProcessorFieldsType],
    ['vesselSensors', vesselSensorsType],
    ['dockingPort', dockingPortType],
    ['engine', engineType],
    ['path', pathType],
    ['structure', structureType],
    ['node', nodeType],
    ['none', noneType],
    ['boolean', booleanType],
    ['string', stringType],
    ['scalar', scalarType],
    ['integer', integerType],
    ['double', doubleType],
    ['delegate', delegateType],
    ['bodyTarget', bodyTargetType],
    ['volume', volumeType],
    ['volumeItem', volumeItemType],
    ['part', partType],
    ['alt', vesselAltType],
    ['addons', addonListType],
    ['rgba', rgbaType],
    ['config', configType],
    ['constant', constantType],
    ['control', controlConnectionType],
    ['core', coreType],
    ['orbitInfo', orbitInfoType],
    ['eta', vesselEtaType],
    ['facing', directionType],
    ['direction', directionType],
    ['geoposition', geoCoordinatesType],
    ['homeconnection', homeConnectionType],
    ['kuniverse', kUniverseType],
    ['vesselTarget', vesselTargetType],
    ['vector', vectorType],
    ['stage', stageType],
    ['steeringmanager', steeringManagerType],
    ['terminal', terminalStructType],
    ['time', timeSpanType],
    ['velocity', orbitableType],
    ['orbitable', orbitableType],
    ['version', versionInfoType],
    ['bounds', boundsType],
    ['orbitableVelocity', orbitableVelocityType],
    ['serializable', serializableType],
    ['builtInDelegate', builtInDelegateType],
    ['userList', userListType],
    ['pidLoop', pidLoopType],
    ['volumeDirectory', volumeDirectoryType],
    ['resourceTransfer', resourceTransferType],
    ['lexicon', lexiconType],
    ['volumeFile', volumeFileType],
    ['range', rangeType],
    ['kacAlarm', kacAlarmType],
    ['bodyAtmosphere', bodyAtmosphereType],
    ['waypoint', waypointType],
    ['career', careerType],
    ['highlight', highlightType],
    ['guiWidget', guiWidgetType],
    ['vectorRenderer', vectorRendererType],
    ['scienceData', scienceDataType],
    ['partModule', partModuleType],
    ['vesselList', listType.apply(vesselTargetType)],
    ['partModuleList', listType.apply(partModuleType)],
    ['shipParts', listType.apply(partType)],
    ['partList', listType.apply(partType)],
    ['scienceExperimentList', listType.apply(scienceExperimentType)],
    ['scienceExperiment', scienceExperimentType],
    ['voice', voiceType],
    ['note', noteType],
    ['hsva', hsvaType],
    ['NULL', noneType],
  ]);
  
/* const SpecialHint: [string[], IType][] = [
    ['list', listType],
    ['queue', queueType],
    ['stack', stackType],
    ['uniqueSet', uniqueSetType],
  ]; */