import { IResolverError } from "./types";
import { IToken } from "../entities/types";

export class ResolverError implements IResolverError {
    constructor(
        public readonly token: IToken, 
        public readonly message: string,
        public readonly otherInfo: string[]) {
    }
}