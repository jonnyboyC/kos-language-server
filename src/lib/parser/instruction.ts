import { InstructionInterface, Scope, ExprInterface } from "./types";
import { TokenInterface } from "../scanner/types";
import { ExecOptionsWithStringEncoding } from "child_process";

export class Instruction implements InstructionInterface {
    get tag(): 'stmt' {
        return 'stmt';
    }
}

export class InstructionBlock extends Instruction {
    public open: TokenInterface;
    public instructions: Instruction[]
    public close: TokenInterface

    constructor(open: TokenInterface, instructions: Instruction[], close: TokenInterface) {
        super();
        this.open = open;
        this.instructions = instructions;
        this.close = close;
    }
}


export class VariableDeclaration extends Instruction {
    public scope?: Scope;
    public suffix: ExprInterface;
    public toIs: TokenInterface;
    public value: ExprInterface;

    constructor(suffix: ExprInterface, toIs: TokenInterface, value: ExprInterface, scope?: Scope) {
        super();
        this.scope = scope;
        this.suffix = suffix;
        this.toIs = toIs;
        this.value = value;
    }
}

export class OnOffInstruction extends Instruction {
    public suffix: ExprInterface;
    public onOff: TokenInterface;
    
    constructor(suffix: ExprInterface, onOff: TokenInterface) {
        super();
        this.suffix = suffix;
        this.onOff = onOff;
    }
}