import { IToken } from "../scanner/types";
import { ParameterState } from "./types";

export class KsParameter {
    constructor(
        public readonly name: IToken,
        public readonly defaulted: boolean,
        public state: ParameterState,
    ) 
    { }

    get tag(): 'parameter' {
        return 'parameter';
    }
}
