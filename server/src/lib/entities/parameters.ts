import { IToken } from "./types";
import { ParameterState } from "../analysis/types";

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
