import { TokenInterface } from "../scanner/types";
import { ExprInterface, InstInterface } from "./types";
import { TokenType } from "../scanner/tokentypes";

export class Expr implements ExprInterface {
    get tag(): 'expr' {
        return 'expr';
    }
}

export class ExprBinary extends Expr {
    constructor(
        public readonly left: ExprInterface, 
        public readonly operator: TokenInterface, 
        public readonly right: ExprInterface) {
        super()
    }

    public toString(): string {
        return `${this.left.toString()} ${this.operator.lexeme} ${this.right.toString()}`;
    }
}

export class ExprUnary extends Expr {
    constructor(
        public readonly operator: TokenInterface, 
        public readonly factor: ExprInterface) {
        super();
    }

    public toString(): string {
        return `${this.operator.lexeme} ${this.factor.toString()}`;
    }
}

export class ExprFactor extends Expr {
    constructor(
        public readonly suffix: ExprInterface, 
        public readonly power: TokenInterface, 
        public readonly exponent: ExprInterface) {
        super();
    }

    public toString(): string {
        return `${this.suffix.toString()} ${this.power.toString()} ${this.exponent.toString()}`;
    }
}

export class ExprSuffix extends Expr {
    constructor(
        public readonly suffix: ExprInterface, 
        public readonly colon: TokenInterface, 
        public readonly trailer: ExprInterface) {
        super();
    }

    public toString(): string {
        return `${this.suffix.toString()}${this.colon.lexeme}${this.trailer.toString()}`;
    }
}

export class ExprCall extends Expr {
    constructor(
        public readonly callee: ExprInterface, 
        public readonly open: TokenInterface, 
        public readonly args: ExprInterface[], 
        public readonly close: TokenInterface) {
        super();
    }

    public toString(): string {
        return `${this.callee.toString()}${this.open.lexeme}${this.args.map(a => a.toString()).join(", ")}${this.close.lexeme}`;
    }
}

export class ExprArrayIndex extends Expr {
    constructor(
        public readonly array: ExprInterface, 
        public readonly indexer: TokenInterface, 
        public readonly index: TokenInterface) {
        super();
    }

    public toString(): string {
        return `${this.array.toString()}${this.indexer.lexeme}${this.index.lexeme}`;
    }
}

export class ExprArrayBracket extends Expr {
    constructor(
        public readonly array: ExprInterface, 
        public readonly open: TokenInterface, 
        public readonly index: ExprInterface,
        public readonly close: TokenInterface) {
        super();
    }

    public toString(): string {
        return `${this.array.toString()}${this.open.lexeme}${this.index.toString()}${this.close.lexeme}`;
    }
}

export class ExprDelegate extends Expr {
    constructor (
        public readonly variable: ExprInterface, 
        public readonly atSign: TokenInterface) {
        super();
    }
    
    public toString(): string {
        return `${this.variable.toString()}${this.atSign.lexeme}`;
    }
}

export class ExprLiteral extends Expr {
    constructor(public readonly token: TokenInterface) {
        super();
    }

    public toString(): string {
        return `${this.token.lexeme}`;
    }
}

export class ExprVariable extends Expr {
    constructor(
        public readonly token: TokenInterface) {
        super();
    }

    public get isKeyword(): boolean {
        return !(this.token.type === TokenType.Identifier
            || this.token.type === TokenType.FileIdentifier);
    }

    public toString(): string {
        return `${this.token.lexeme}`;
    }
}

export class ExprGrouping extends Expr {
    constructor(
        public readonly open: TokenInterface, 
        public readonly expr: ExprInterface, 
        public readonly close: TokenInterface) {
        super();
    }

    public toString(): string {
        return `${this.open.lexeme}${this.expr.toString()}${this.close.lexeme}`;
    }
}

export class ExprAnonymousFunction extends Expr {
    constructor(
        public readonly open: TokenInterface,
        public readonly instruction: InstInterface[],
        public readonly close: TokenInterface) {
        super();
    }

    public toString(): string {
        return `{${this.instruction.map(i => i.toString()).join(' ')}}`
    }
}