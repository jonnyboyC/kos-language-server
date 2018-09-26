import { Inst } from "./inst";
import { IScope, IExpr, IInst } from "./types";
import { IToken } from "../scanner/types";
import { TokenType } from "../scanner/tokentypes";

export class Declare extends Inst {
    constructor() { super(); }
}

export class Scope implements IScope {
    constructor(
        public readonly scope?: IToken,
        public readonly declare?: IToken) {
    }
}

export class VariableDeclaration extends Declare {
    constructor(
        public readonly suffix: IExpr,
        public readonly toIs: IToken,
        public readonly expression: IExpr,
        public readonly scope?: IScope) {
        super();
    }
}

export class LockDeclaration extends Declare {
    constructor(
        public readonly lock: IToken,
        public readonly identifier: IToken,
        public readonly to: IToken,
        public readonly value: IExpr,
        public readonly scope?: IScope) {
        super();
    }
}

export class FunctionDeclartion extends Declare {
    constructor(
        public readonly functionToken: IToken,
        public readonly functionIdentifier: IToken,
        public readonly instruction: IInst,
        public readonly scope?: IScope) {
        super();
    }
}

export class Parameter {
    constructor(
        public readonly identifier: IToken) {
    }

    public get isKeyword(): boolean {
        return !(this.identifier.type === TokenType.Identifier
            || this.identifier.type === TokenType.FileIdentifier);
    }
}

export class DefaultParameter {
    constructor(
        public readonly identifier: IToken,
        public readonly toIs: IToken,
        public readonly value: IExpr) {
    }

    get isKeyword(): boolean {
        return this.identifier.type !== TokenType.Identifier
    }
}

export class ParameterDeclaration extends Declare {
    constructor(
        public readonly parameterToken: IToken,
        public readonly parameters: IToken[],
        public readonly defaultParameters: DefaultParameter[],
        public readonly scope?: IScope) {
        super();
    }
}