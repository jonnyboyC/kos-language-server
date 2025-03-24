import { createType, noMap } from "../../utilities/typeCreators";
import { serializableType } from "../primitives/serializeableStructure";

export const timeBaseType = createType('timeBase');
timeBaseType.addSuper(noMap(serializableType));

