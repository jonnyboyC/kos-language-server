import { KsParameter } from "./parameters";

export class KsFile {
    constructor(
        public readonly fileName: string,
        public readonly parameters: KsParameter[],
    ) 
    { }
}