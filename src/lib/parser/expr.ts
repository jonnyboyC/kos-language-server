import { TokenInterface } from "../scanner/types";
import { ExprInterface } from "./types";

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
}

export class ExprUnary extends Expr {
    public operator: TokenInterface;
    public factor: ExprInterface;
    constructor(operator: TokenInterface, factor: ExprInterface) {
        super();
        this.factor = factor;
        this.operator = operator;
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
}

export class ExprDelegate extends Expr {
    public atSign: TokenInterface;
    public variable: ExprInterface;
    constructor (variable: ExprInterface, atSign: TokenInterface) {
        super();
        this.variable = variable;
        this.atSign = atSign
    }
}

export class ExprLiteral extends Expr {
    public token: TokenInterface;
    constructor(token: TokenInterface) {
        super();
        this.token = token;
    }
}

export class ExprVariable extends Expr {
    public token: TokenInterface;
    constructor(token: TokenInterface) {
        super();
        this.token = token;
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
}