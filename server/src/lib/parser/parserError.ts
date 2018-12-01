import { IParseError } from "./types";
import { IToken } from "../scanner/types";

export class ParseError implements IParseError {

    public readonly inner: IParseError[];

    constructor(
        public readonly token: IToken, 
        public readonly message: string,
        public readonly otherInfo: string[]) {
        this.inner = [];
    }
    
    get tag(): 'parseError' {
        return 'parseError'
    }
}