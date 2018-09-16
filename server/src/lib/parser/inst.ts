import { InstInterface, ExprInterface } from "./types";
import { TokenInterface } from "../scanner/types";

export class Inst implements InstInterface {
    get tag(): 'inst' {
        return 'inst';
    }
}

export class InstructionBlock extends Inst {
    constructor( 
        public readonly open: TokenInterface,
        public readonly instructions: Inst[],
        public readonly close: TokenInterface) {
        super();
    }
}

export class ExprInst extends Inst {
    constructor(
        public readonly suffix: ExprInterface) {
        super();
    }
}

export class OnOffInst extends Inst {
    constructor(
        public readonly suffix: ExprInterface,
        public readonly onOff: TokenInterface) {
        super();
    }
}

export class CommandInst extends Inst {
    constructor(public readonly command: TokenInterface) {
        super();
    }
}

export class CommandExpressionInst extends Inst {
    constructor(
        public readonly command: TokenInterface,
        public readonly expression: ExprInterface) {
        super();
    }
}

export class UnsetInst extends Inst {
    constructor(
        public readonly unset: TokenInterface,
        public readonly identifier: TokenInterface) {
        super();
    }
}

export class UnlockInst extends Inst {
    constructor(
        public readonly unlock: TokenInterface,
        public readonly identifier: TokenInterface) {
        super();
    }
}

export class SetInst extends Inst {
    constructor(
        public readonly set: TokenInterface,
        public readonly suffix: ExprInterface,
        public readonly to: TokenInterface,
        public readonly value: ExprInterface) {
        super();
    }
}

export class LazyGlobalInst extends Inst {
    constructor(
        public readonly atSign: TokenInterface,
        public readonly lazyGlobal: TokenInterface,
        public readonly onOff: TokenInterface) {
        super();
    }
}

export class IfInst extends Inst {
    constructor(
        public readonly ifToken: TokenInterface,
        public readonly condition: ExprInterface,
        public readonly instruction: InstInterface,
        public readonly elseInst?: InstInterface) {
        super()
    }
}

export class ElseInst extends Inst {
    constructor(
        public readonly elseToken: TokenInterface,
        public readonly instruction: InstInterface) {
        super();
    }
}

export class UntilInst extends Inst {
    constructor(
        public readonly until: TokenInterface,
        public readonly condition: ExprInterface,
        public readonly instruction: InstInterface) {
        super()
    }
}

export class FromInst extends Inst {
    constructor(
        public readonly from: TokenInterface,
        public readonly initializer: InstInterface,
        public readonly until: TokenInterface,
        public readonly condition: ExprInterface,
        public readonly step: TokenInterface,
        public readonly increment: InstInterface,
        public readonly doToken: TokenInterface,
        public readonly instruction: InstInterface) {
        super();
    }
}

export class WhenInst extends Inst {
    constructor(
        public readonly when: TokenInterface, 
        public readonly condition: ExprInterface,
        public readonly then: TokenInterface,
        public readonly instruction: InstInterface) {
        super();
    }
}

export class ReturnInst extends Inst {
    constructor(
        public readonly returnToken: TokenInterface,
        public readonly value?: ExprInterface) {
        super();
    }
}

export class BreakInst extends Inst {
    constructor(
        public readonly breakToken: TokenInterface) {
        super();
    }
}

export class SwitchInst extends Inst {
    constructor(
        public readonly switchToken: TokenInterface,
        public readonly to: TokenInterface,
        public readonly target: ExprInterface) {
        super();
    }
}

export class ForInst extends Inst {
    constructor(
        public readonly forToken: TokenInterface,
        public readonly identifier: TokenInterface,
        public readonly inToken: TokenInterface,
        public readonly suffix: ExprInterface,
        public readonly instruction: InstInterface) {
        super();
    }
}

export class OnInst extends Inst {
    constructor(
        public readonly on: TokenInterface,
        public readonly suffix: ExprInterface,
        public readonly instruction: InstInterface) {
        super();
    }
}

export class ToggleInst extends Inst {
    constructor(
        public readonly toggle: TokenInterface,
        public readonly suffix: ExprInterface) {
        super();
    }
}

export class WaitInst extends Inst {
    constructor(
        public readonly wait: TokenInterface,
        public readonly expression: ExprInterface,
        public readonly until?: TokenInterface) {
        super();
    }
}

export class LogInst extends Inst {
    constructor(
        public readonly log: TokenInterface,
        public readonly expression: ExprInterface,
        public readonly to: TokenInterface,
        public readonly target: ExprInterface) {
        super();
    }
}

export class CopyInst extends Inst {
    constructor(
        public readonly copy: TokenInterface,
        public readonly expression: ExprInterface,
        public readonly toFrom: TokenInterface,
        public readonly target: ExprInterface) {
        super();
    }
}

export class RenameInst extends Inst {
    constructor(
        public readonly rename: TokenInterface,
        public readonly ioIdentifer: TokenInterface,
        public readonly expression: ExprInterface,
        public readonly to: TokenInterface,
        public readonly target: ExprInterface) {
        super();
    }
}



export class DeleteInst extends Inst {
    constructor(
        public readonly deleteToken: TokenInterface,
        public readonly expression: ExprInterface,
        public readonly from?: TokenInterface,
        public readonly target?: ExprInterface) {
        super();
    }
}

export class RunInst extends Inst {
    constructor(
        public readonly run: TokenInterface,
        public readonly identifier: TokenInterface,
        public readonly once?: TokenInterface,
        public readonly open?: TokenInterface,
        public readonly args?: ExprInterface[],
        public readonly close?: TokenInterface,
        public readonly on?: TokenInterface,
        public readonly expr?: ExprInterface ) {
        super();
    }
}

export class RunPathInst extends Inst {
    constructor(
        public readonly runPath: TokenInterface,
        public readonly open: TokenInterface,
        public readonly expression: ExprInterface,
        public readonly close: TokenInterface,
        public readonly args?: ExprInterface[]) {
        super();
    }
}

export class RunPathOnceInst extends Inst {
    constructor(
        public readonly runPath: TokenInterface,
        public readonly open: TokenInterface,
        public readonly expression: ExprInterface,
        public readonly close: TokenInterface,
        public readonly args?: ExprInterface[]) {
        super();
    }
}

export class CompileInst extends Inst {
    constructor(
        public readonly compile: TokenInterface,
        public readonly expression: ExprInterface,
        public readonly to?: TokenInterface,
        public readonly target?: ExprInterface) {
        super();
    }
}

export class ListInst extends Inst {
    constructor(
        public readonly list: TokenInterface,
        public readonly identifier?: TokenInterface,
        public readonly inToken?: TokenInterface,
        public readonly target?: TokenInterface) {
        super();
    }   
}

export class EmptyInst extends Inst {
    constructor(public readonly empty: TokenInterface) {
        super();
    }
}

export class PrintInst extends Inst {
    constructor(
        public readonly print: TokenInterface,
        public readonly expressions: ExprInterface,
        public readonly at?: TokenInterface,
        public readonly open?: TokenInterface,
        public readonly x?: ExprInterface,
        public readonly y?: ExprInterface,
        public readonly close?: TokenInterface) {
        super();
    }
}