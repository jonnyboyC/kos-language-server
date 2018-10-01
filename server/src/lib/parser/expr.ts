import { IToken } from "../scanner/types";
import { IExpr, IInst, IExprVisitor } from "./types";
import { TokenType } from "../scanner/tokentypes";

export abstract class Expr implements IExpr {
    get tag(): 'expr' {
        return 'expr';
    }

    public abstract accept<T>(visitor: IExprVisitor<T>): T 
}

export class BinaryExpr extends Expr {
    constructor(
        public readonly left: IExpr, 
        public readonly operator: IToken, 
        public readonly right: IExpr) {
        super()
    }

    public toString(): string {
        return `${this.left.toString()} ${this.operator.lexeme} ${this.right.toString()}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitBinary(this);
    }
}

export class UnaryExpr extends Expr {
    constructor(
        public readonly operator: IToken, 
        public readonly factor: IExpr) {
        super();
    }

    public toString(): string {
        return `${this.operator.lexeme} ${this.factor.toString()}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitUnary(this);
    }
}

export class FactorExpr extends Expr {
    constructor(
        public readonly suffix: IExpr, 
        public readonly power: IToken, 
        public readonly exponent: IExpr) {
        super();
    }

    public toString(): string {
        return `${this.suffix.toString()} ${this.power.toString()} ${this.exponent.toString()}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitFactor(this);
    }
}

export class SuffixExpr extends Expr {
    constructor(
        public readonly suffix: IExpr, 
        public readonly colon: IToken, 
        public readonly trailer: IExpr) {
        super();
    }

    public toString(): string {
        return `${this.suffix.toString()}${this.colon.lexeme}${this.trailer.toString()}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitSuffix(this);
    }
}

export class CallExpr extends Expr {
    constructor(
        public readonly callee: IExpr, 
        public readonly open: IToken, 
        public readonly args: IExpr[], 
        public readonly close: IToken) {
        super();
    }

    public toString(): string {
        return `${this.callee.toString()}${this.open.lexeme}${this.args.map(a => a.toString()).join(", ")}${this.close.lexeme}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitCall(this);
    }
}

export class ArrayIndexExpr extends Expr {
    constructor(
        public readonly array: IExpr, 
        public readonly indexer: IToken, 
        public readonly index: IToken) {
        super();
    }

    public toString(): string {
        return `${this.array.toString()}${this.indexer.lexeme}${this.index.lexeme}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitArrayIndex(this);
    }
}

export class ArrayBracketExpr extends Expr {
    constructor(
        public readonly array: IExpr, 
        public readonly open: IToken, 
        public readonly index: IExpr,
        public readonly close: IToken) {
        super();
    }

    public toString(): string {
        return `${this.array.toString()}${this.open.lexeme}${this.index.toString()}${this.close.lexeme}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitArrayBracket(this);
    }
}

export class DelegateExpr extends Expr {
    constructor (
        public readonly variable: IExpr, 
        public readonly atSign: IToken) {
        super();
    }
    
    public toString(): string {
        return `${this.variable.toString()}${this.atSign.lexeme}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitDelegate(this);
    }
}

export class LiteralExpr extends Expr {
    constructor(public readonly token: IToken) {
        super();
    }

    public toString(): string {
        return `${this.token.lexeme}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitLiteral(this);
    }
}

export class VariableExpr extends Expr {
    constructor(
        public readonly token: IToken) {
        super();
    }

    public get isKeyword(): boolean {
        return !(this.token.type === TokenType.Identifier
            || this.token.type === TokenType.FileIdentifier);
    }

    public toString(): string {
        return `${this.token.lexeme}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitVariable(this);
    }
}

export class GroupingExpr extends Expr {
    constructor(
        public readonly open: IToken, 
        public readonly expr: IExpr, 
        public readonly close: IToken) {
        super();
    }

    public toString(): string {
        return `${this.open.lexeme}${this.expr.toString()}${this.close.lexeme}`;
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitGrouping(this);
    }
}

export class AnonymousFunctionExpr extends Expr {
    constructor(
        public readonly open: IToken,
        public readonly instruction: IInst[],
        public readonly close: IToken) {
        super();
    }

    public toString(): string {
        return `{${this.instruction.map(i => i.toString()).join(' ')}}`
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        return visitor.visitAnonymousFunction(this);
    }
}