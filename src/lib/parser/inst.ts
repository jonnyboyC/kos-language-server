import { InstInterface, Scope, ExprInterface } from "./types";
import { TokenInterface } from "../scanner/types";

export class Inst implements InstInterface {
    get tag(): 'stmt' {
        return 'stmt';
    }
}

export class InstructionBlock extends Inst {
    public open: TokenInterface;
    public instructions: Inst[]
    public close: TokenInterface

    constructor(open: TokenInterface, instructions: Inst[], close: TokenInterface) {
        super();
        this.open = open;
        this.instructions = instructions;
        this.close = close;
    }
}


export class VariableDeclaration extends Inst {
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

export class OnOffInst extends Inst {
    public suffix: ExprInterface;
    public onOff: TokenInterface;
    
    constructor(suffix: ExprInterface, onOff: TokenInterface) {
        super();
        this.suffix = suffix;
        this.onOff = onOff;
    }
}

export class CommandInst extends Inst {
    public command: TokenInterface;

    constructor(command: TokenInterface) {
        super();
        this.command = command;
    }
}

export class CommandExpressionInst extends Inst {
    public command: TokenInterface;
    public expression: ExprInterface;

    constructor(command: TokenInterface, expression: ExprInterface) {
        super();
        this.command = command;
        this.expression = expression;
    }
}

export class UnsetInst extends Inst {
    public unset: TokenInterface;
    public identifier: TokenInterface;

    constructor(unset: TokenInterface, identifier: TokenInterface) {
        super();
        this.unset = unset;
        this.identifier = identifier;
    }
}

export class UnlockInst extends Inst {
    public unlock: TokenInterface;
    public identifier: TokenInterface;

    constructor(unlock: TokenInterface, identifier: TokenInterface) {
        super();
        this.unlock = unlock;
        this.identifier = identifier;
    }
}

export class SetInst extends Inst {
    public set: TokenInterface;
    public suffix: ExprInterface;
    public to: TokenInterface;
    public value: ExprInterface;

    constructor(set: TokenInterface, suffix: ExprInterface, to: TokenInterface, value: ExprInterface) {
        super();
        this.set = set;
        this.suffix = suffix;
        this.to = to;
        this.value = value;
    }
}

export class LockInst extends Inst {
    public lock: TokenInterface;
    public identifier: TokenInterface;
    public to: TokenInterface;
    public value: ExprInterface;

    constructor(lock: TokenInterface, identifier: TokenInterface, to: TokenInterface, value: ExprInterface) {
        super();
        this.lock = lock;
        this.identifier = identifier;
        this.to = to;
        this.value = value;
    }
}

export class LazyGlobalInst extends Inst {
    public atSign: TokenInterface;
    public lazyGlobal: TokenInterface;
    public onOff: TokenInterface;

    constructor(atSign: TokenInterface, lazyGlobal: TokenInterface, onOff: TokenInterface) {
        super();
        this.atSign = atSign;
        this.lazyGlobal = lazyGlobal;
        this.onOff = onOff;
    }
}

export class IfInst extends Inst {
    public ifToken: TokenInterface;
    public condition: ExprInterface;
    public instruction: InstInterface;
    public elseInst?: InstInterface;

    constructor(ifToken: TokenInterface, condition: ExprInterface, instruction: InstInterface, elseInst?: InstInterface) {
        super();
        this.ifToken = ifToken;
        this.condition = condition;
        this.instruction = instruction;
        this.elseInst = elseInst;
    }
}