import { ParseErrorInterface } from "./types";
import { TokenInterface } from "../scanner/types";

export class ParseError implements ParseErrorInterface {

    constructor(
        public readonly token: TokenInterface, 
        public readonly message: string,
        public readonly otherInfo: string[]) {
    }
    
    get tag(): 'parseError' {
        return 'parseError'
    }
}