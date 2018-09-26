import { IToken } from "../scanner/types";
import { IExpr, IInst, IExprVisitor } from "./types";
import { TokenType } from "../scanner/tokentypes";

export class Expr implements IExpr {
    get tag(): 'expr' {
        return 'expr';
    }

    public accept<T>(visitor: IExprVisitor<T>): T {
        throw new Error("Method not implemented.");
    }
}

export class ExprBinary extends Expr {
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

export class ExprUnary extends Expr {
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

export class ExprFactor extends Expr {
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

export class ExprSuffix extends Expr {
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

export class ExprCall extends Expr {
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

export class ExprArrayIndex extends Expr {
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

export class ExprArrayBracket extends Expr {
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

export class ExprDelegate extends Expr {
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

export class ExprLiteral extends Expr {
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

export class ExprVariable extends Expr {
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

export class ExprGrouping extends Expr {
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

export class ExprAnonymousFunction extends Expr {
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