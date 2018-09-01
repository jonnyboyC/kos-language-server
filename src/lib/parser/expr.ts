import { TokenInterface } from "../scanner/types";
import { ExprInterface } from "./types";

export class Expr implements ExprInterface {
    get tag(): 'expr' {
        return 'expr';
    }
}

export class ExprBinary extends Expr {
    public left: Expr;
    public operator: TokenInterface;
    public right: Expr;
    constructor(left: Expr, operator: TokenInterface, right: Expr) {
        super()
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
}

export class ExprUnary extends Expr {
    public operator: TokenInterface;
    public factor: Expr;
    constructor(operator: TokenInterface, factor: Expr) {
        super();
        this.factor = factor;
        this.operator = operator;
    }
}

export class ExprFactor extends Expr {
    public suffix: Expr;
    public power: TokenInterface;
    public exponent: Expr;
    constructor(suffix: Expr, power: TokenInterface, exponent: Expr) {
        super();
        this.suffix = suffix;
        this.power = power;
        this.exponent = exponent;
    }
}

export class ExprSuffix extends Expr {
    public suffix: Expr;
    public colon: TokenInterface;
    public trailer: Expr;
    constructor(suffix: Expr, colon: TokenInterface, trailer: Expr) {
        super();
        this.suffix = suffix;
        this.colon = colon;
        this.trailer = trailer;
    }
}

export class ExprCall extends Expr {
    public callee: Expr;
    public open: TokenInterface;
    public args: Expr[];
    public close: TokenInterface;
    constructor(callee: Expr, open: TokenInterface, args: Expr[], close: TokenInterface) {
        super();
        this.callee = callee;
        this.open = open;
        this.args = args;
        this.close = close;
    }
}

export class ExprArrayIndex extends Expr {
    public array: Expr;
    public indexer: TokenInterface;
    public index: TokenInterface;
    constructor(array: Expr, indexer: TokenInterface, index: TokenInterface) {
        super();
        this.array = array;
        this.indexer = indexer;
        this.index = index;
    }
}

export class ExprArrayBracket extends Expr {
    public array: Expr;
    public open: TokenInterface;
    public index: Expr;
    public close: TokenInterface;
    constructor(array: Expr, open: TokenInterface, index: Expr, close: TokenInterface) {
        super();
        this.array = array;
        this.open = open;
        this.index = index;
        this.close = close;
    }
}

export class ExprDelegate extends Expr {
    public atSign: TokenInterface;
    public variable: Expr;
    constructor (variable: Expr, atSign: TokenInterface) {
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
    public expr: Expr;

    constructor(open: TokenInterface, expr: Expr, close: TokenInterface) {
        super();
        this.open = open;
        this.expr = expr;
        this.close = close;
    }
}