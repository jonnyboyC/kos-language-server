import { ParseErrorInterface } from "./types";
import { TokenInterface } from "../scanner/types";

export class ParseError implements ParseErrorInterface {
    public message: string;
    public token: TokenInterface

    constructor(token: TokenInterface, message: string) {
        this.message = message;
        this.token = token;
    }
    
    get tag(): 'parseError' {
        return 'parseError'
    }


}