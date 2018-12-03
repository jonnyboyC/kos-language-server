import { IToken } from "../scanner/types";
import { VariableState } from "./types";
import { ScopeType } from "../parser/types";

export class KsVariable {
    constructor(
        public readonly scope: ScopeType,
        public readonly name: IToken,
        public state: VariableState
    ) 
    { }

    get tag(): 'variable' {
        return 'variable';
    }
}

