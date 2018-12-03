import { LockState } from "./types";
import { IToken } from "../scanner/types";
import { ScopeType } from "../parser/types";

export class KsLock {
    constructor(
        public readonly scope: ScopeType,
        public readonly token: IToken,
        public readonly identifer: IToken,
        public readonly defaulted: boolean,
        public state: LockState,
    ) 
    { }

    get tag(): 'lock' {
        return 'lock';
    }
}