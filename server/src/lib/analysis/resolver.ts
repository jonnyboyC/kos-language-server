import { IInstVisitor, IExprVisitor, IExpr } from "../parser/types";
import {
    BinaryExpr, UnaryExpr,
    FactorExpr, SuffixExpr,
    CallExpr, ArrayIndexExpr,
    ArrayBracketExpr, DelegateExpr,
    LiteralExpr, VariableExpr,
    GroupingExpr, AnonymousFunctionExpr, Expr,
} from '../parser/expr';
import {
    BlockInst, ExprInst,
    OnOffInst, CommandInst,
    CommandExpressionInst, 
    UnsetInst, UnlockInst,
    SetInst, LazyGlobalInst,
    IfInst, ElseInst,
    UntilInst, FromInst,
    WhenInst, ReturnInst,
    BreakInst, SwitchInst,
    ForInst, OnInst,
    ToggleInst, WaitInst,
    LogInst, CopyInst,
    RenameInst, DeleteInst,
    RunInst, RunPathInst,
    RunPathOnceInst, CompileInst,
    ListInst, EmptyInst, 
    PrintInst,
    Inst
} from '../parser/inst'
import { IScope, IStack, VariableState, ScopeType } from "./types";
import { TokenType } from "../scanner/tokentypes";
import { ResolverError } from "./resolverError";
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from "../parser/declare";
import { KsVariable } from "./variable";
import { IToken } from "../scanner/types";
import { empty } from "../utilities/typeGuards";

type Errors = Array<ResolverError>

export class Resolver implements IExprVisitor<Errors>, IInstVisitor<Errors> {
    private readonly _insts: Inst[];
    private readonly _scopes: IStack<IScope>;
    private readonly _global: IScope;
    private _lazyGlobalOff: boolean;
    private _firstInst: boolean;

    constructor(insts: Inst[]) {
        this._insts = insts;
        this._scopes = [];
        this._global = new Map();
        this._lazyGlobalOff = true;
        this._firstInst = true;
    }

    // resolve the sequence of instructions
    public resolve(): Errors {
        const [firstInst, ...restInsts] = this._insts;
        const firstPossibleError = firstInst instanceof LazyGlobalInst
            ? this.visitLazyGlobalInst(firstInst)
            : []

        this._firstInst = false;
        
        return firstPossibleError.concat(this.resolveInsts(restInsts));
    }

    // resolve the given set of instructions
    public resolveInsts(insts: Inst[]): Errors {
        return accumulateErrors(insts, this.resolveInst.bind(this));
    }

    // resolve for an instruction
    private resolveInst(inst: Inst): Errors {
        return inst.accept(this);
    }

    // resolve for an expression
    private resolveExpr(expr: Expr): Errors {
        return expr.accept(this);
    }

    // declare a variable
    private declare(scopeType: ScopeType, token: IToken): Maybe<ResolverError> {
        const scope = scopeType == ScopeType.global
            ? this._global
            : this.peekScope();

        if (scope.has(token.lexeme)) {
            return new ResolverError()
        }

        scope.set(token.lexeme, new KsVariable(scopeType, token, VariableState.declared))
        return undefined;
    }

    // define a variable
    private define(token: IToken): Maybe<ResolverError> {
        const scope = this.peekScope();
        const variable = scope.get(token.lexeme);

        // if variable is found update its state and return
        if (!empty(variable)) {
            variable.state = VariableState.defined;
            return undefined;
        }

        // if lazy global is on define new global variable
        if (!this._lazyGlobalOff) {
            const global = this._global;
            const globalVariable = global.get(token.lexeme);

            // if global already exits update value
            if (!empty(globalVariable)) {
                globalVariable.state = VariableState.defined;
                return undefined;
            }

            // otherwise create new variable and set to defined
            global.set(token.lexeme, new KsVariable(ScopeType.global, token, VariableState.defined))
            return undefined;
        }

        return new ResolverError();
    }

    // peek the current scope
    private peekScope(): IScope {
        const scope = this._scopes[this._scopes.length - 1];
        return scope || this._global;
    }

    // push new scope onto scope stack
    private beginScope(): void {
        this._scopes.push(new Map());
    }

    // pop a scope and check variable validity
    private endScope(): Errors {
        const scope = this._scopes.pop();

        if (scope && !this._lazyGlobalOff) {
            return Array.from(scope.values())
                .filter(variable => variable.state !== VariableState.used)
                .map(() => new ResolverError()) 
        }

        return [];
    }

    /* --------------------------------------------

    Instructions

    ----------------------------------------------*/

    public visitDeclVariable(decl: DeclVariable): Errors {
        if (!empty(decl.scope)) {
            decl.suffix.
        } else {

        }

        return [];
    }

    public visitDeclLock(decl: DeclLock): ResolverError[] {
        if (!empty(decl.scope)) {

        } else {

        }

        return [];    
    }

    public visitDeclFunction(decl: DeclFunction): ResolverError[] {
        if (!empty(decl.scope)) {

        } else {

        }

        return [];    }

    public visitDeclParameter(decl: DeclParameter): ResolverError[] {
        if (!empty(decl.scope)) {

        } else {

        }

        return [];    }

    public visitBlock(inst: BlockInst): Errors {
        this.beginScope();
        const errors = this.resolveInsts(inst.instructions);
        this.endScope();

        return errors;
    }
    public visitExpr(inst: ExprInst): Errors {
        return this.resolveExpr(inst.suffix);
    }
    public visitOnOff(inst: OnOffInst): Errors {
        return this.resolveExpr(inst.suffix);
    }
    public visitCommand(_inst: CommandInst): Errors {
        return [];
    }
    public visitCommandExpr(inst: CommandExpressionInst): Errors {
        return this.resolveExpr(inst.expression)
    }
    public visitUnset(inst: UnsetInst): Errors {
        return [];
    }
    public visitUnlock(inst: UnlockInst): Errors {
        return [];
    }
    public visitSet(inst: SetInst): Errors {
        throw new Error("Method not implemented.");
    }
    public visitLazyGlobalInst(inst: LazyGlobalInst): Errors {
        // It is an error if lazy global is not at the start of a file
        if (!this._firstInst) {
            return [new ResolverError()]
        }
    
        this._lazyGlobalOff = inst.onOff.type === TokenType.Off;
        return [];
    }
    public visitIf(inst: IfInst): Errors {
        let errors = this.resolveExpr(inst.condition)
            .concat(this.resolveInst(inst.instruction));

        if (inst.elseInst) {
            errors = errors.concat(
                this.resolveInst(inst.elseInst));
        }

        return errors;
    }
    public visitElse(inst: ElseInst): Errors {
        return this.resolveInst(inst.instruction);
    }
    public visitUntil(inst: UntilInst): Errors {
        return this.resolveExpr(inst.condition)
            .concat(this.resolveInst(inst.instruction));
    }
    public visitFrom(inst: FromInst): Errors {
        return this.resolveInst(inst.initializer)
            .concat(this.resolveExpr(inst.condition),
                this.resolveInst(inst.increment),
                this.resolveInst(inst.instruction));
    }
    public visitWhen(inst: WhenInst): Errors {
        return this.resolveExpr(inst.condition)
            .concat(this.resolveInst(inst.instruction));
    }
    public visitReturn(inst: ReturnInst): Errors {
        return inst.value
            ? this.resolveExpr(inst.value)
            : [];
    }
    public visitBreak(inst: BreakInst): Errors {
        return [];
    }
    public visitSwitch(inst: SwitchInst): Errors {
        return this.resolveExpr(inst.target);
    }
    public visitFor(inst: ForInst): Errors {
        this.declare(ScopeType.local, inst.identifier)
        this.define(inst.identifier);

        return this.resolveExpr(inst.suffix)
            .concat(this.resolveInst(inst.instruction));
    }
    public visitOn(inst: OnInst): Errors {
        return this.resolveExpr(inst.suffix)
            .concat(this.resolveInst(inst.instruction));
    }
    public visitToggle(inst: ToggleInst): Errors {
        return this.resolveExpr(inst.suffix);
    }
    public visitWait(inst: WaitInst): Errors {
        return this.resolveExpr(inst.expression);
    }
    public visitLog(inst: LogInst): Errors {
        return this.resolveExpr(inst.expression)
            .concat(this.resolveExpr(inst.target));
    }
    public visitCopy(inst: CopyInst): Errors {
        return this.resolveExpr(inst.expression)
            .concat(this.resolveExpr(inst.target));
    }
    public visitRename(inst: RenameInst): Errors {
        return this.resolveExpr(inst.expression)
            .concat(this.resolveExpr(inst.target));
    }
    public visitDelete(inst: DeleteInst): Errors {
        return this.resolveExpr(inst.expression)
            .concat(inst.target ? this.resolveExpr(inst.target) : []);
    }
    public visitRun(inst: RunInst): Errors {
        return inst.args
            ? accumulateErrors(inst.args, this.resolveExpr.bind(this))
            : [];
    }
    public visitRunPath(inst: RunPathInst): Errors {
        let errors = this.resolveExpr(inst.expression);
        if (inst.args) {
            errors.concat(
                accumulateErrors(inst.args, this.resolveExpr.bind(this)));
        }

        return errors;
    }
    public visitRunPathOnce(inst: RunPathOnceInst): Errors {
        let errors = this.resolveExpr(inst.expression);
        if (inst.args) {
            errors.concat(
                accumulateErrors(inst.args, this.resolveExpr.bind(this)));
        }

        return errors;
    }
    public visitCompile(inst: CompileInst): Errors {
        return this.resolveExpr(inst.expression)
            .concat(inst.target ? this.resolveExpr(inst.target) : []);
    }
    public visitList(_inst: ListInst): Errors {
        return [];
    }
    public visitEmpty(_inst: EmptyInst): Errors {
        return [];
    }
    public visitPrint(inst: PrintInst): Errors {
        return this.resolveExpr(inst.expression);
    }


    /* --------------------------------------------

    Expressions

    ----------------------------------------------*/

    public visitBinary(expr: BinaryExpr): Errors {
        return this.resolveExpr(expr.left)
            .concat(this.resolveExpr(expr.right));
    }    
    public visitUnary(expr: UnaryExpr): Errors {
        return this.resolveExpr(expr.factor);
    }
    public visitFactor(expr: FactorExpr): Errors {
        return this.resolveExpr(expr.suffix)
            .concat(this.resolveExpr(expr.exponent));
    }
    public visitSuffix(expr: SuffixExpr): Errors {
        return this.resolveExpr(expr.suffix)
            .concat(this.resolveExpr(expr.trailer));
    }
    public visitCall(expr: CallExpr): Errors {
        return this.resolveExpr(expr.callee)
            .concat(accumulateErrors(expr.args, this.resolveExpr.bind(this)));
    }
    public visitArrayIndex(expr: ArrayIndexExpr): Errors {
        return this.resolveExpr(expr.array);
    }
    public visitArrayBracket(expr: ArrayBracketExpr): Errors {
        return this.resolveExpr(expr.array)
            .concat(this.resolveExpr(expr.index));
    }
    public visitDelegate(expr: DelegateExpr): Errors {
        expr.variable

        throw new Error("Method not implemented.");
    }
    public visitLiteral(_expr: LiteralExpr): Errors {
        return [];
    }
    public visitVariable(_expr: VariableExpr): Errors {
        // TODO unsure how to handle this
        return [];
    }
    public visitGrouping(expr: GroupingExpr): Errors {
        return this.resolveExpr(expr.expr);
    }
    public visitAnonymousFunction(expr: AnonymousFunctionExpr): Errors {
        return this.resolveInsts(expr.instruction);
    }
}

const accumulateErrors = <T>(items: Array<T>, checker: (item: T) => Errors): Errors => {
    return items.reduce((accumulator, item) => 
        accumulator.concat(checker(item)),
        [] as Errors);
} 