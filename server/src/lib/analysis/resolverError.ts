import { IToken } from "../scanner/types";
import { IResolverError } from "./types";


export class ResolverError implements IResolverError {
    constructor(
        public readonly token: IToken, 
        public readonly message: string,
        public readonly otherInfo: string[]) {
    }
}