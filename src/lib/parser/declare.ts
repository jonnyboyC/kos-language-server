import { Inst } from "./inst";
import { ScopeInterface, ExprInterface, InstInterface } from "./types";
import { TokenInterface } from "../scanner/types";

export class Declare extends Inst {
    constructor() { super(); }
}

export class Scope implements ScopeInterface {
    constructor(
        public readonly scope?: TokenInterface,
        public readonly declare?: TokenInterface) {
    }
}

export class VariableDeclaration extends Declare {
    constructor(
        public readonly suffix: ExprInterface,
        public readonly toIs: TokenInterface,
        public readonly expression: ExprInterface,
        public readonly scope?: ScopeInterface) {
        super();
    }
}

export class LockDeclaration extends Declare {
    constructor(
        public readonly lock: TokenInterface,
        public readonly identifier: TokenInterface,
        public readonly to: TokenInterface,
        public readonly value: ExprInterface,
        public readonly scope?: ScopeInterface) {
        super();
    }
}

export class FunctionDeclartion extends Declare {
    constructor(
        public readonly functionToken: TokenInterface,
        public readonly functionIdentifier: TokenInterface,
        public readonly instruction: InstInterface,
        public readonly scope?: ScopeInterface) {
        super();
    }
}

export class DefaultParameter {
    constructor(
        public readonly identifier: TokenInterface,
        public readonly toIs: TokenInterface,
        public readonly value: ExprInterface) {
    }
}

export class ParameterDeclaration extends Declare {
    constructor(
        public readonly parameterToken: TokenInterface,
        public readonly parameters: TokenInterface[],
        public readonly defaultParameters: DefaultParameter[],
        public readonly scope?: ScopeInterface) {
        super();
    }
}