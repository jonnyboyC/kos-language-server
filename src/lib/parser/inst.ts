import { InstInterface, Scope, ExprInterface } from "./types";
import { TokenInterface } from "../scanner/types";

export class Inst implements InstInterface {
    get tag(): 'inst' {
        return 'inst';
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

export class ElseInst extends Inst {
    public elseToken: TokenInterface;
    public instruction: InstInterface;

    constructor(elseToken: TokenInterface, instruction: InstInterface) {
        super();
        this.elseToken = elseToken;
        this.instruction = instruction;
    }
}

export class UntilInst extends Inst {
    public until: TokenInterface;
    public condition: ExprInterface;
    public instruction: InstInterface;

    constructor(until: TokenInterface, condition: ExprInterface, instruction: InstInterface) {
        super();
        this.until = until;
        this.condition = condition;
        this.instruction = instruction;
    }
}

export class FromInst extends Inst {
    public from: TokenInterface;
    public initializer: InstInterface;
    public until: TokenInterface;
    public condition: ExprInterface;
    public increment: InstInterface;
    public doToken: TokenInterface;
    public instruction: InstInterface;

    constructor(from: TokenInterface,
        initializer: InstInterface,
        until: TokenInterface,
        condition: ExprInterface,
        increment: InstInterface,
        doToken: TokenInterface,
        instruction: InstInterface) {
        super();

        this.from = from;
        this.initializer = initializer;
        this.until = until;
        this.condition = condition;
        this.increment = increment;
        this.doToken = doToken;
        this.instruction = instruction;
    }
}

export class WhenInst extends Inst {
    constructor(
        public when: TokenInterface, 
        public condition: ExprInterface,
        public then: TokenInterface,
        public instruction: InstInterface) {
        super();
    }
}

export class ReturnInst extends Inst {
    constructor(
        public returnToken: TokenInterface,
        public value?: ExprInterface) {
        super();
    }
}

export class SwitchInst extends Inst {
    constructor(
        public switchToken: TokenInterface,
        public to: TokenInterface,
        public target: ExprInterface) {
        super();
    }
}

export class ForInst extends Inst {
    constructor(
        public forToken: TokenInterface,
        public identifier: TokenInterface,
        public inToken: TokenInterface,
        public suffix: ExprInterface,
        public instruction: InstInterface) {
        super();
    }
}
