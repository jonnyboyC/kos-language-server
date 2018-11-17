import { IToken } from "../scanner/types";
import { VariableState, ScopeType } from "./types";

export class KsVariable {
    constructor(
        public readonly scope: ScopeType,
        public readonly name: IToken,
        public state: VariableState
    ) 
    { }

    get tag(): string {
        return 'variable';
    }
}

