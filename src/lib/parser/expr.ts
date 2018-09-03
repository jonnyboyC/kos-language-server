import { TokenInterface } from "../scanner/types";
import { ExprInterface, InstInterface } from "./types";

export class Expr implements ExprInterface {
    get tag(): 'expr' {
        return 'expr';
    }
}

export class ExprBinary extends Expr {
    public left: ExprInterface;
    public operator: TokenInterface;
    public right: ExprInterface;
    constructor(left: ExprInterface, operator: TokenInterface, right: ExprInterface) {
        super()
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    public toString(): string {
        return `${this.left.toString()} ${this.operator.lexeme} ${this.right.toString()}`;
    }
}

export class ExprUnary extends Expr {
    public operator: TokenInterface;
    public factor: ExprInterface;
    constructor(operator: TokenInterface, factor: ExprInterface) {
        super();
        this.factor = factor;
        this.operator = operator;
    }

    public toString(): string {
        return `${this.operator.lexeme} ${this.factor.toString()}`;
    }
}

export class ExprFactor extends Expr {
    public suffix: ExprInterface;
    public power: TokenInterface;
    public exponent: ExprInterface;
    constructor(suffix: ExprInterface, power: TokenInterface, exponent: ExprInterface) {
        super();
        this.suffix = suffix;
        this.power = power;
        this.exponent = exponent;
    }

    public toString(): string {
        return `${this.suffix.toString()} ${this.power.toString()} ${this.exponent.toString()}`;
    }
}

export class ExprSuffix extends Expr {
    public suffix: ExprInterface;
    public colon: TokenInterface;
    public trailer: ExprInterface;
    constructor(suffix: ExprInterface, colon: TokenInterface, trailer: ExprInterface) {
        super();
        this.suffix = suffix;
        this.colon = colon;
        this.trailer = trailer;
    }

    public toString(): string {
        return `${this.suffix.toString()}${this.colon.lexeme}${this.trailer.toString()}`;
    }
}

export class ExprCall extends Expr {
    public callee: ExprInterface;
    public open: TokenInterface;
    public args: ExprInterface[];
    public close: TokenInterface;
    constructor(callee: ExprInterface, open: TokenInterface, args: ExprInterface[], close: TokenInterface) {
        super();
        this.callee = callee;
        this.open = open;
        this.args = args;
        this.close = close;
    }

    public toString(): string {
        return `${this.callee.toString()}${this.open.lexeme}${this.args.map(a => a.toString()).join(", ")}${this.close.lexeme}`;
    }
}

export class ExprArrayIndex extends Expr {
    public array: ExprInterface;
    public indexer: TokenInterface;
    public index: TokenInterface;
    constructor(array: ExprInterface, indexer: TokenInterface, index: TokenInterface) {
        super();
        this.array = array;
        this.indexer = indexer;
        this.index = index;
    }

    public toString(): string {
        return `${this.array.toString()}${this.indexer.lexeme}${this.index.lexeme}`;
    }
}

export class ExprArrayBracket extends Expr {
    public array: ExprInterface;
    public open: TokenInterface;
    public index: ExprInterface;
    public close: TokenInterface;
    constructor(array: ExprInterface, open: TokenInterface, index: ExprInterface, close: TokenInterface) {
        super();
        this.array = array;
        this.open = open;
        this.index = index;
        this.close = close;
    }

    public toString(): string {
        return `${this.array.toString()}${this.open.lexeme}${this.index.toString()}${this.close.lexeme}`;
    }
}

export class ExprDelegate extends Expr {
    public variable: ExprInterface;
    public atSign: TokenInterface;
    constructor (variable: ExprInterface, atSign: TokenInterface) {
        super();
        this.variable = variable;
        this.atSign = atSign
    }
    
    public toString(): string {
        return `${this.variable.toString()}${this.atSign.lexeme}`;
    }
}

export class ExprLiteral extends Expr {
    public token: TokenInterface;
    constructor(token: TokenInterface) {
        super();
        this.token = token;
    }

    public toString(): string {
        return `${this.token.lexeme}`;
    }
}

export class ExprVariable extends Expr {
    public token: TokenInterface;
    constructor(token: TokenInterface) {
        super();
        this.token = token;
    }

    public toString(): string {
        return `${this.token.lexeme}`;
    }
}

export class ExprGrouping extends Expr {
    public open: TokenInterface;
    public close: TokenInterface;
    public expr: ExprInterface;

    constructor(open: TokenInterface, expr: ExprInterface, close: TokenInterface) {
        super();
        this.open = open;
        this.expr = expr;
        this.close = close;
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