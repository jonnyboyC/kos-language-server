import { Inst } from "./inst";
import { IDeclScope, IExpr, IInst, IInstVisitor } from "./types";
import { IToken } from "../scanner/types";
import { TokenType } from "../scanner/tokentypes";
import { SuffixExpr } from "./expr";

export abstract class Decl extends Inst {
    constructor() { 
        super(); 
    }
}

export class DeclScope implements IDeclScope {
    constructor(
        public readonly scope?: IToken,
        public readonly declare?: IToken) {
    }
}

export class DeclVariable extends Decl {
    constructor(
        public readonly suffix: IExpr,
        public readonly toIs: IToken,
        public readonly expression: IExpr,
        public readonly scope?: IDeclScope) {
        super();
    }

    accept<T>(visitor: IInstVisitor<T>): T {
        return visitor.visitDeclVariable(this);
    }
}

export class DeclLock extends Decl {
    constructor(
        public readonly lock: IToken,
        public readonly identifier: IToken,
        public readonly to: IToken,
        public readonly value: IExpr,
        public readonly scope?: IDeclScope) {
        super();
    }

    accept<T>(visitor: IInstVisitor<T>): T {
        return visitor.visitDeclLock(this);
    }
}

export class DeclFunction extends Decl {
    constructor(
        public readonly functionToken: IToken,
        public readonly functionIdentifier: IToken,
        public readonly instruction: IInst,
        public readonly scope?: IDeclScope) {
        super();
    }

    accept<T>(visitor: IInstVisitor<T>): T {
        return visitor.visitDeclFunction(this);
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

export class DeclParameter extends Decl {
    constructor(
        public readonly parameterToken: IToken,
        public readonly parameters: IToken[],
        public readonly defaultParameters: DefaultParameter[],
        public readonly scope?: IDeclScope) {
        super();
    }

    accept<T>(visitor: IInstVisitor<T>): T {
        return visitor.visitDeclParameter(this);
    }
}