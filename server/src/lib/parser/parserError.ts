import { ParseErrorInterface } from "./types";
import { TokenInterface } from "../scanner/types";

export class ParseError implements ParseErrorInterface {

    public readonly inner: ParseErrorInterface[];

    constructor(
        public readonly token: TokenInterface, 
        public readonly message: string,
        public readonly otherInfo: string[]) {
        this.inner = [];
    }
    
    get tag(): 'parseError' {
        return 'parseError'
    }
}