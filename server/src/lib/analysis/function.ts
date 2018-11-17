import { IToken } from "../scanner/types";
import { KsParameters } from "./parameters";
import { ScopeType } from "./types";

export class KsFunction {
    constructor(
        public readonly scope: ScopeType,
        public readonly token: IToken,
        public readonly identifer: IToken,
        public readonly parameters: KsParameters,
        public readonly returnValue: boolean
    ) 
    { }

    get tag(): string {
        return 'function'
    }
}