import { IToken } from "../scanner/types";


export class ResolverError {
    constructor(
        public readonly token: IToken, 
        public readonly message: string,
        public readonly otherInfo: string[]) {
    }
}