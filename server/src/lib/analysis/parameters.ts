import { IToken } from "../scanner/types";
import { ParameterState, ScopeType } from "./types";

export class KsParameter {
    constructor(
        public readonly scope: ScopeType,
        public readonly token: IToken,
        public readonly defaulted: boolean,
        public state: ParameterState,
    ) 
    { }
}

export class KsParameters {
    constructor(
        public readonly parameters: KsParameter[]
    )
    { }
}