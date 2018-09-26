import { IInst, IExpr } from "./types";
import { IToken } from "../scanner/types";

export class Inst implements IInst {
    get tag(): 'inst' {
        return 'inst';
    }
}

export class InstructionBlock extends Inst {
    constructor( 
        public readonly open: IToken,
        public readonly instructions: Inst[],
        public readonly close: IToken) {
        super();
    }
}

export class ExprInst extends Inst {
    constructor(
        public readonly suffix: IExpr) {
        super();
    }
}

export class OnOffInst extends Inst {
    constructor(
        public readonly suffix: IExpr,
        public readonly onOff: IToken) {
        super();
    }
}

export class CommandInst extends Inst {
    constructor(public readonly command: IToken) {
        super();
    }
}

export class CommandExpressionInst extends Inst {
    constructor(
        public readonly command: IToken,
        public readonly expression: IExpr) {
        super();
    }
}

export class UnsetInst extends Inst {
    constructor(
        public readonly unset: IToken,
        public readonly identifier: IToken) {
        super();
    }
}

export class UnlockInst extends Inst {
    constructor(
        public readonly unlock: IToken,
        public readonly identifier: IToken) {
        super();
    }
}

export class SetInst extends Inst {
    constructor(
        public readonly set: IToken,
        public readonly suffix: IExpr,
        public readonly to: IToken,
        public readonly value: IExpr) {
        super();
    }
}

export class LazyGlobalInst extends Inst {
    constructor(
        public readonly atSign: IToken,
        public readonly lazyGlobal: IToken,
        public readonly onOff: IToken) {
        super();
    }
}

export class IfInst extends Inst {
    constructor(
        public readonly ifToken: IToken,
        public readonly condition: IExpr,
        public readonly instruction: IInst,
        public readonly elseInst?: IInst) {
        super()
    }
}

export class ElseInst extends Inst {
    constructor(
        public readonly elseToken: IToken,
        public readonly instruction: IInst) {
        super();
    }
}

export class UntilInst extends Inst {
    constructor(
        public readonly until: IToken,
        public readonly condition: IExpr,
        public readonly instruction: IInst) {
        super()
    }
}

export class FromInst extends Inst {
    constructor(
        public readonly from: IToken,
        public readonly initializer: IInst,
        public readonly until: IToken,
        public readonly condition: IExpr,
        public readonly step: IToken,
        public readonly increment: IInst,
        public readonly doToken: IToken,
        public readonly instruction: IInst) {
        super();
    }
}

export class WhenInst extends Inst {
    constructor(
        public readonly when: IToken, 
        public readonly condition: IExpr,
        public readonly then: IToken,
        public readonly instruction: IInst) {
        super();
    }
}

export class ReturnInst extends Inst {
    constructor(
        public readonly returnToken: IToken,
        public readonly value?: IExpr) {
        super();
    }
}

export class BreakInst extends Inst {
    constructor(
        public readonly breakToken: IToken) {
        super();
    }
}

export class SwitchInst extends Inst {
    constructor(
        public readonly switchToken: IToken,
        public readonly to: IToken,
        public readonly target: IExpr) {
        super();
    }
}

export class ForInst extends Inst {
    constructor(
        public readonly forToken: IToken,
        public readonly identifier: IToken,
        public readonly inToken: IToken,
        public readonly suffix: IExpr,
        public readonly instruction: IInst) {
        super();
    }
}

export class OnInst extends Inst {
    constructor(
        public readonly on: IToken,
        public readonly suffix: IExpr,
        public readonly instruction: IInst) {
        super();
    }
}

export class ToggleInst extends Inst {
    constructor(
        public readonly toggle: IToken,
        public readonly suffix: IExpr) {
        super();
    }
}

export class WaitInst extends Inst {
    constructor(
        public readonly wait: IToken,
        public readonly expression: IExpr,
        public readonly until?: IToken) {
        super();
    }
}

export class LogInst extends Inst {
    constructor(
        public readonly log: IToken,
        public readonly expression: IExpr,
        public readonly to: IToken,
        public readonly target: IExpr) {
        super();
    }
}

export class CopyInst extends Inst {
    constructor(
        public readonly copy: IToken,
        public readonly expression: IExpr,
        public readonly toFrom: IToken,
        public readonly target: IExpr) {
        super();
    }
}

export class RenameInst extends Inst {
    constructor(
        public readonly rename: IToken,
        public readonly ioIdentifer: IToken,
        public readonly expression: IExpr,
        public readonly to: IToken,
        public readonly target: IExpr) {
        super();
    }
}



export class DeleteInst extends Inst {
    constructor(
        public readonly deleteToken: IToken,
        public readonly expression: IExpr,
        public readonly from?: IToken,
        public readonly target?: IExpr) {
        super();
    }
}

export class RunInst extends Inst {
    constructor(
        public readonly run: IToken,
        public readonly identifier: IToken,
        public readonly once?: IToken,
        public readonly open?: IToken,
        public readonly args?: IExpr[],
        public readonly close?: IToken,
        public readonly on?: IToken,
        public readonly expr?: IExpr ) {
        super();
    }
}

export class RunPathInst extends Inst {
    constructor(
        public readonly runPath: IToken,
        public readonly open: IToken,
        public readonly expression: IExpr,
        public readonly close: IToken,
        public readonly args?: IExpr[]) {
        super();
    }
}

export class RunPathOnceInst extends Inst {
    constructor(
        public readonly runPath: IToken,
        public readonly open: IToken,
        public readonly expression: IExpr,
        public readonly close: IToken,
        public readonly args?: IExpr[]) {
        super();
    }
}

export class CompileInst extends Inst {
    constructor(
        public readonly compile: IToken,
        public readonly expression: IExpr,
        public readonly to?: IToken,
        public readonly target?: IExpr) {
        super();
    }
}

export class ListInst extends Inst {
    constructor(
        public readonly list: IToken,
        public readonly identifier?: IToken,
        public readonly inToken?: IToken,
        public readonly target?: IToken) {
        super();
    }   
}

export class EmptyInst extends Inst {
    constructor(public readonly empty: IToken) {
        super();
    }
}

export class PrintInst extends Inst {
    constructor(
        public readonly print: IToken,
        public readonly expressions: IExpr,
        public readonly at?: IToken,
        public readonly open?: IToken,
        public readonly x?: IExpr,
        public readonly y?: IExpr,
        public readonly close?: IToken) {
        super();
    }
}