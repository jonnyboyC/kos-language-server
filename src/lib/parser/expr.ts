import { TokenInterface } from "../scanner/types";
import { ExprInterface } from "./types";

export class Expr implements ExprInterface {
    get tag(): 'expr' {
        return 'expr';
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

export class ExprCall extends Expr {
    public callee: Expr;
    public args: Expr[];
    public closeParen: TokenInterface;
    constructor(callee: Expr, args: Expr[], closeParen: TokenInterface) {
        super();
        this.callee = callee;
        this.args = args;
        this.closeParen = closeParen;
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