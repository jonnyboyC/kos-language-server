import { InstructionInterface } from "./types";

export class Instruction implements InstructionInterface {
    get tag(): 'stmt' {
        return 'stmt';
    }
}