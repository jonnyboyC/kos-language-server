import { IInstVisitor, IExprVisitor, IExpr, IInst, ScopeType } from "../parser/types";
import {
    BinaryExpr, UnaryExpr,
    FactorExpr, SuffixExpr,
    CallExpr, ArrayIndexExpr,
    ArrayBracketExpr, DelegateExpr,
    LiteralExpr, VariableExpr,
    GroupingExpr, AnonymousFunctionExpr,
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
import { IScope, IStack, VariableState } from "./types";
import { TokenType } from "../scanner/tokentypes";
import { ResolverError } from "./resolverError";
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from "../parser/declare";
import { KsVariable } from "./variable";
import { IToken } from "../scanner/types";
import { empty } from "../utilities/typeGuards";
import { LocalResolver } from "./localResolver";
import { SetResolver } from "./setResolver";

export type Errors = Array<ResolverError>

export class Resolver implements IExprVisitor<Errors>, IInstVisitor<Errors> {
    private readonly _insts: Inst[];
    private readonly _scopes: IStack<IScope>;
    private readonly _global: IScope;
    private readonly _localResolver: LocalResolver;
    private readonly _setResolver: SetResolver;
    private _lazyGlobalOff: boolean;
    private _firstInst: boolean;

    constructor(insts: Inst[]) {
        this._insts = insts;
        this._scopes = [];
        this._global = new Map();
        this._localResolver = new LocalResolver();
        this._setResolver = new SetResolver();
        this._lazyGlobalOff = false;
        this._firstInst = true;
    }

    // resolve the sequence of instructions
    public resolve(): Errors {
        this.beginScope();
        const [firstInst, ...restInsts] = this._insts;

        // check for lazy global flag
        const firstError = this.resolveInst(firstInst)
        this._firstInst = false;
        
        // resolve reset
        const resolveErrors = this.resolveInsts(restInsts);
        const scopeErrors = this.endScope();
        return firstError.concat(resolveErrors, scopeErrors);
    }

    // resolve the given set of instructions
    public resolveInsts(insts: IInst[]): Errors {
        return accumulateErrors(insts, this.resolveInst.bind(this));
    }

    // resolve for an instruction
    private resolveInst(inst: IInst): Errors {
        return inst.accept(this);
    }

    // resolve for an expression
    private resolveExpr(expr: IExpr): Errors {
        return expr.accept(this);
    }

    // declare a variable
    private declare(scopeType: ScopeType, token: IToken): Maybe<ResolverError> {
        const variable = this.lookup(token);

        // check if variable has already been defined
        if (!empty(variable)) {
            return new ResolverError(token, `Variable ${variable.name.lexeme} already exists here ${variable.name.start}.`, []);
        }

        const scope = scopeType == ScopeType.global
            ? this._global
            : this.peekScope();

        scope.set(token.lexeme, new KsVariable(scopeType, token, VariableState.declared))
        return undefined;
    }

    // // define a variable
    private use(token: IToken): Maybe<ResolverError> {
        const variable = this.lookup(token);

        // check that variable has already been defined
        if (empty(variable)) {
            return new ResolverError(token, `Variable ${token.lexeme} does not exist.`, []);
        }

        variable.state = VariableState.used;
        return undefined;
    }

    private define(token: IToken): Maybe<ResolverError> {
        const variable = this.lookup(token);

        // check that variable has already been defined
        if (empty(variable)) {
            return new ResolverError(token, `Variable ${token.lexeme} does not exist.`, []);
        }

        return undefined;
    }

    private declareLocals(scopeType: ScopeType, expr: IExpr): Errors {
        return this.filterErrors(
            this._localResolver.resolveExpr(expr)
                .map(variable => this.declare(scopeType, variable)));
    }

    // attempt to lookup variable return error if not found
    private useLocals(expr: IExpr): Errors {
        return this.filterErrors(
            this._localResolver.resolveExpr(expr)
                .map(variable => this.use(variable)));
    }

    // attempt a variable lookup
    private lookup(token: IToken): Maybe<KsVariable> {
        for (let i = this._scopes.length - 1; i >= 0; i--) {
            const scope = this._scopes[i];
            const variable = scope.get(token.lexeme);
            if (!empty(variable)) {
                return variable;
            }
        }

        const variable = this._global.get(token.lexeme);
        if (!empty(variable)) {
            return variable;
        }

        return undefined;
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

        if (!empty(scope)) {
            return Array.from(scope.values())
                .filter(variable => variable.state !== VariableState.used)
                .map((variable) => new ResolverError(variable.name, `Variable ${variable.name.lexeme} was not used.`, [])) 
        }

        return [];
    }

    // filter to just actual errors
    private filterErrors(maybeError: Maybe<ResolverError>[]): Errors {
        const errors: Errors = [];
        for(const error of maybeError) {
            if (!empty(error)) {
                errors.push(error);
            }
        }

        return errors;
    }

    /* --------------------------------------------

    Instructions

    ----------------------------------------------*/

    public visitDeclVariable(decl: DeclVariable): Errors {
        const { scope } = decl;

        const scopeType = !empty(scope)
            ? scope.type
            : ScopeType.global;

        const declareErrors = this.declareLocals(scopeType, decl.suffix);
        const useErrors = this.useLocals(decl.expression);
        
        return declareErrors.concat(useErrors);
    }

    public visitDeclLock(decl: DeclLock): ResolverError[] {
        const { scope } = decl;

        const scopeType = !empty(scope)
            ? scope.type
            : ScopeType.global;

        const declareError = this.declare(scopeType, decl.identifier);
        const useErrors = this.useLocals(decl.value);
        const resolveErrors = this.resolveExpr(decl.value);
        
        return empty(declareError)
            ? useErrors.concat(resolveErrors)
            : useErrors.concat(declareError, resolveErrors);
    }

    public visitDeclFunction(decl: DeclFunction): ResolverError[] {
        const scopeType = decl.scope
            ? decl.scope.type
            : ScopeType.global;

        const declareError = this.declare(scopeType, decl.functionIdentifier)
        const resolveErrors = this.resolveInst(decl.instruction);

        const errors = empty(declareError)
            ? resolveErrors
            : resolveErrors.concat(declareError)
        
        return errors;
    }

    public visitDeclParameter(decl: DeclParameter): ResolverError[] {
        const scopeError: Maybe<ResolverError>[] = [];

        // check that parameter isn't declared global
        if (!empty(decl.scope) && !empty(decl.scope.scope)) {
            if (decl.scope.scope.type === TokenType.Global) {
                scopeError.push(new ResolverError(decl.scope.scope, `parameter ${decl.parameterToken} cannot be global`, []));
            }
        }
        
        const scopeType = ScopeType.local;

        // need to check if default paraemter can really be abbitrary expr
        const parameterErrors = decl.parameters
            .map(parameter => this.declare(scopeType, parameter));
        const defaultParameterErrors = decl.defaultParameters
            .map(parameter => this.declare(scopeType, parameter.identifier));
        
        return this.filterErrors(scopeError.concat(parameterErrors, defaultParameterErrors));
    }

    public visitBlock(inst: BlockInst): Errors {
        this.beginScope();
        const errors = this.resolveInsts(inst.instructions);
        this.endScope();

        return errors;
    }
    public visitExpr(inst: ExprInst): Errors {
        const useErrors = this.useLocals(inst.suffix);
        const resolveErrors = this.resolveExpr(inst.suffix);

        return useErrors.concat(resolveErrors);
    }
    public visitOnOff(inst: OnOffInst): Errors {
        const useErrors = this.useLocals(inst.suffix);
        const resolveErrors = this.resolveExpr(inst.suffix);

        return this.filterErrors(useErrors.concat(resolveErrors));
    }
    public visitCommand(_inst: CommandInst): Errors {
        return [];
    }
    public visitCommandExpr(inst: CommandExpressionInst): Errors {
        const useErrors = this.useLocals(inst.expression);
        const resolveErrors = this.resolveExpr(inst.expression);

        return this.filterErrors(useErrors.concat(resolveErrors));    
    }
    public visitUnset(inst: UnsetInst): Errors {
        const error = this.use(inst.identifier)
        return empty(error) ? [] : [error];
    }
    public visitUnlock(inst: UnlockInst): Errors {
        const error = this.use(inst.identifier)
        return empty(error) ? [] : [error];
    }
    public visitSet(inst: SetInst): Errors {
        const varToken = this._setResolver.resolveExpr(inst.suffix);
        if (empty(varToken)) {
            const tokens = this._localResolver.resolveExpr(inst.suffix)
            return [new ResolverError(tokens[0], `cannot assign to variable ${tokens[0]}`, [])]
        }

        if (!this._lazyGlobalOff) {
            if (empty(this.lookup(varToken))) {
                this._global.set(
                    varToken.lexeme, 
                    new KsVariable(ScopeType.global, varToken, VariableState.declared)
                );
            }
        }

        const defineError = this.define(varToken);
        const useErrors = this.useLocals(inst.value);
        const resolveErrors = this.resolveExpr(inst.value);

        return !empty(defineError)
            ? useErrors.concat(resolveErrors, defineError)
            : useErrors.concat(resolveErrors);
    }
    public visitLazyGlobalInst(inst: LazyGlobalInst): Errors {
        // It is an error if lazy global is not at the start of a file
        if (!this._firstInst) {
            return [new ResolverError(inst.lazyGlobal, `Lazy global was not declared at top of the file`, [])]
        }
    
        this._lazyGlobalOff = inst.onOff.type === TokenType.Off;
        return [];
    }
    public visitIf(inst: IfInst): Errors {
        const useErrors = this.useLocals(inst.condition);

        let resolveErrors = this.resolveExpr(inst.condition)
            .concat(this.resolveInst(inst.instruction));

        if (inst.elseInst) {
            resolveErrors = resolveErrors.concat(
                this.resolveInst(inst.elseInst));
        }

        return useErrors.concat(resolveErrors);
    }
    public visitElse(inst: ElseInst): Errors {
        return this.resolveInst(inst.instruction);
    }
    public visitUntil(inst: UntilInst): Errors {
        return this.useLocals(inst.condition).concat(
            this.resolveExpr(inst.condition),
            this.resolveInst(inst.instruction));
    }
    public visitFrom(inst: FromInst): Errors {
        return this.resolveInst(inst.initializer)
            .concat(
                this.useLocals(inst.condition),
                this.resolveExpr(inst.condition),
                this.resolveInst(inst.increment),
                this.resolveInst(inst.instruction));
    }
    public visitWhen(inst: WhenInst): Errors {
        return this.resolveExpr(inst.condition)
            .concat(this.resolveInst(inst.instruction));
    }
    public visitReturn(inst: ReturnInst): Errors {
        if (inst.value) {
            return this.useLocals(inst.value)
                .concat(this.resolveExpr(inst.value));
        }

        return [];
    }
    public visitBreak(_inst: BreakInst): Errors {
        return [];
    }
    public visitSwitch(inst: SwitchInst): Errors {
        return this.useLocals(inst.target)
            .concat(this.resolveExpr(inst.target));
    }
    public visitFor(inst: ForInst): Errors {
        const declareError = this.declare(ScopeType.local, inst.identifier)

        const errors = this.useLocals(inst.suffix).concat(
            this.resolveExpr(inst.suffix),
            this.resolveInst(inst.instruction));
        
        if (!empty(declareError)) {
            return [declareError].concat(errors);
        }

        return errors;
    }
    public visitOn(inst: OnInst): Errors {
        return this.useLocals(inst.suffix).concat( 
            this.resolveExpr(inst.suffix),
            this.resolveInst(inst.instruction))
    }
    public visitToggle(inst: ToggleInst): Errors {
        return this.useLocals(inst.suffix)
            .concat(this.resolveExpr(inst.suffix));
    }
    public visitWait(inst: WaitInst): Errors {
        return this.useLocals(inst.expression)
            .concat(this.resolveExpr(inst.expression));
    }
    public visitLog(inst: LogInst): Errors {
        return this.useLocals(inst.expression).concat(
            this.resolveExpr(inst.expression),
            this.useLocals(inst.target),
            this.resolveExpr(inst.target));
    }
    public visitCopy(inst: CopyInst): Errors {
        return this.useLocals(inst.expression).concat(
            this.resolveExpr(inst.expression),
            this.useLocals(inst.target),
            this.resolveExpr(inst.target));
    }
    public visitRename(inst: RenameInst): Errors {
        return this.useLocals(inst.expression).concat(
            this.resolveExpr(inst.expression),
            this.useLocals(inst.target),
            this.resolveExpr(inst.target));
    }
    public visitDelete(inst: DeleteInst): Errors {
        if (empty(inst.target)) {
            return this.useLocals(inst.expression).concat(
                this.resolveExpr(inst.expression));
        }

        return this.useLocals(inst.expression).concat(
            this.resolveExpr(inst.expression),
            this.useLocals(inst.target),
            this.resolveExpr(inst.target));
    }
    public visitRun(inst: RunInst): Errors {
        if (empty(inst.args)) {
            return [];
        }

        return accumulateErrors(inst.args, this.useLocals.bind(this)).concat(
            accumulateErrors(inst.args, this.resolveExpr.bind(this)));
    }
    public visitRunPath(inst: RunPathInst): Errors {
        if (empty(inst.args)) {
            return this.useLocals(inst.expression)
                .concat(this.resolveExpr(inst.expression));
        }

        return this.useLocals(inst.expression).concat(
            this.resolveExpr(inst.expression),
            accumulateErrors(inst.args, this.useLocals.bind(this)),
            accumulateErrors(inst.args, this.resolveExpr.bind(this)));
    }
    public visitRunPathOnce(inst: RunPathOnceInst): Errors {
        if (empty(inst.args)) {
            return this.useLocals(inst.expression)
                .concat(this.resolveExpr(inst.expression));
        }

        return this.useLocals(inst.expression).concat(
            this.resolveExpr(inst.expression),
            accumulateErrors(inst.args, this.useLocals.bind(this)),
            accumulateErrors(inst.args, this.resolveExpr.bind(this)));
    }
    public visitCompile(inst: CompileInst): Errors {
        if (empty(inst.target)) {
            return this.useLocals(inst.expression)
                .concat(this.resolveExpr(inst.expression)); 
        }

        return this.useLocals(inst.expression).concat(
            this.resolveExpr(inst.expression),
            this.useLocals(inst.target),
            this.resolveExpr(inst.target));
    }
    public visitList(_inst: ListInst): Errors {
        return [];
    }
    public visitEmpty(_inst: EmptyInst): Errors {
        return [];
    }
    public visitPrint(inst: PrintInst): Errors {
        return this.useLocals(inst.expression)
            .concat(this.resolveExpr(inst.expression));
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
        return this.resolveExpr(expr.variable);
    }
    public visitLiteral(_expr: LiteralExpr): Errors {
        return [];
    }
    public visitVariable(_expr: VariableExpr): Errors {
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