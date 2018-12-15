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
import { ResolverError } from "./resolverError";
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from "../parser/declare";
import { empty } from "../utilities/typeGuards";
import { ScopeManager } from "./scopeManager";
import { ParameterState } from "./types";
import { fileInsts } from "../entities/fileInsts";
import { IToken } from "../entities/types";
import { KsParameter } from "../entities/parameters";

export type Errors = Array<ResolverError>

export class FuncResolver implements IExprVisitor<Errors>, IInstVisitor<Errors> {
    private readonly _start: IToken;
    private readonly _end: IToken;
    private readonly _insts: Inst[];
    private readonly _scopeMan: ScopeManager;

    constructor(fileInsts: fileInsts, scopeMan: ScopeManager) {
        this._start = fileInsts.start;
        this._end = fileInsts.end;
        this._insts = fileInsts.insts;
        this._scopeMan = scopeMan;
    }

    // resolve the sequence of instructions
    public resolve(): Errors {
        this._scopeMan.rewindScope();
        this._scopeMan.beginScope(this._start);

        const resolveErrors = this.resolveInsts(this._insts);
        const scopeErrors = this._scopeMan.endScope(this._end);

        return resolveErrors.concat(scopeErrors);
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

    /* --------------------------------------------

    Declarations

    ----------------------------------------------*/

    // check variable declaration
    public visitDeclVariable(decl: DeclVariable): Errors {
        return this.resolveExpr(decl.expression)
    }

    // check lock declaration
    public visitDeclLock(_decl: DeclLock): ResolverError[] {
        return [];
    }

    // check function declaration
    public visitDeclFunction(decl: DeclFunction): ResolverError[] {
        let scopeType = decl.scope && decl.scope.type;

        // functions are default global at file scope and local everywhere else
        if (empty(scopeType)) {
            scopeType = this._scopeMan.isFile()
                ? ScopeType.global
                : ScopeType.local;
        }


        let returnValue = false;
        let parameterDecls: DeclParameter[] = [];
        for (const inst of decl.instructionBlock.instructions) {

            // get parameters for this function
            if (inst instanceof DeclParameter) {
                parameterDecls.push(inst);
                continue;
            }
            
            // determine if return exists
            if (inst instanceof ReturnInst) {
                returnValue = true;
            }
        }
        const [parameters, errors] = this.buildParameters(parameterDecls);
        const declareErrors = this._scopeMan.declareFunction(
            scopeType, decl.functionIdentifier, parameters, returnValue);
        const instErrors = this.resolveInst(decl.instructionBlock);

        return empty(declareErrors)
            ? instErrors.concat(errors)
            : instErrors.concat(errors, declareErrors);
    }

    private buildParameters(decls: DeclParameter[]): [KsParameter[], Errors] {
        let parameters: KsParameter[] = [];
        let errors: Errors = [];
        let defaulted = false;

        for (const decl of decls) {
            for (const parameter of decl.parameters) {
                if (defaulted) {
                    errors.push(new ResolverError(parameter, 'Normal parameters cannot occur after defaulted parameters', []));
                } 
                parameters.push(new KsParameter(parameter, false, ParameterState.declared));
            }

            for (const parameter of decl.defaultParameters) {
                defaulted = true;
                parameters.push(new KsParameter(parameter.identifier, true, ParameterState.declared));
            }
        }

        return [parameters, errors]
    }

    // check parameter declaration
    public visitDeclParameter(_decl: DeclParameter): ResolverError[] {
        return [];
    }

    /* --------------------------------------------

    Instructions

    ----------------------------------------------*/

    public visitBlock(inst: BlockInst): Errors {
        this._scopeMan.beginScope(inst.open);
        const errors = this.resolveInsts(inst.instructions);
        this._scopeMan.endScope(inst.close);

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
        return this.resolveExpr(inst.expression);
    }

    public visitUnset(_inst: UnsetInst): Errors {
        return [];
    }

    public visitUnlock(_inst: UnlockInst): Errors {
        return [];
    }

    public visitSet(inst: SetInst): Errors {
        return this.resolveExpr(inst.value);
    }

    public visitLazyGlobalInst(_inst: LazyGlobalInst): Errors {
        return [];
    }

    public visitIf(inst: IfInst): Errors {
        let resolveErrors = this.resolveExpr(inst.condition)
            .concat(this.resolveInst(inst.instruction));

        if (inst.elseInst) {
            resolveErrors = resolveErrors.concat(
                this.resolveInst(inst.elseInst));
        }

        return resolveErrors;
    }

    public visitElse(inst: ElseInst): Errors {
        return this.resolveInst(inst.instruction);
    }

    public visitUntil(inst: UntilInst): Errors {
        return this.resolveExpr(inst.condition).concat(
            this.resolveInst(inst.instruction));
    }

    public visitFrom(inst: FromInst): Errors {
        return this.resolveInsts(inst.initializer.instructions).concat(
            this.resolveExpr(inst.condition),
            this.resolveInsts(inst.increment.instructions),
            this.resolveInst(inst.instruction));
    }

    public visitWhen(inst: WhenInst): Errors {
        return this.resolveExpr(inst.condition)
            .concat(this.resolveInst(inst.instruction));
    }

    public visitReturn(inst: ReturnInst): Errors {
        if (inst.value) {
            return this.resolveExpr(inst.value);
        }

        return [];
    }

    public visitBreak(_inst: BreakInst): Errors {
        return [];
    }

    public visitSwitch(inst: SwitchInst): Errors {
        return this.resolveExpr(inst.target)
    }

    public visitFor(inst: ForInst): Errors {
        return this.resolveExpr(inst.suffix).concat(
            this.resolveInst(inst.instruction));
    }

    public visitOn(inst: OnInst): Errors {
        return this.resolveExpr(inst.suffix).concat( 
            this.resolveInst(inst.instruction))
    }

    public visitToggle(inst: ToggleInst): Errors {
        return this.resolveExpr(inst.suffix);
    }

    public visitWait(inst: WaitInst): Errors {
        return this.resolveExpr(inst.expression);
    }

    public visitLog(inst: LogInst): Errors {
        return this.resolveExpr(inst.expression).concat(
            this.resolveExpr(inst.target));
    }

    public visitCopy(inst: CopyInst): Errors {
        return this.resolveExpr(inst.expression).concat(
            this.resolveExpr(inst.target));
    }

    public visitRename(inst: RenameInst): Errors {
        return this.resolveExpr(inst.expression).concat(
            this.resolveExpr(inst.target));
    }

    public visitDelete(inst: DeleteInst): Errors {
        if (empty(inst.target)) {
            return this.resolveExpr(inst.expression);
        }

        return this.resolveExpr(inst.expression).concat(
            this.resolveExpr(inst.target));
    }

    public visitRun(inst: RunInst): Errors {
        if (empty(inst.args)) {
            return [];
        }

        return accumulateErrors(inst.args, this.resolveExpr.bind(this));
    }

    public visitRunPath(inst: RunPathInst): Errors {
        if (empty(inst.args)) {
            return this.resolveExpr(inst.expression);
        }

        return this.resolveExpr(inst.expression).concat(
            accumulateErrors(inst.args, this.resolveExpr.bind(this)));
    }

    public visitRunPathOnce(inst: RunPathOnceInst): Errors {
        if (empty(inst.args)) {
            return this.resolveExpr(inst.expression);
        }

        return this.resolveExpr(inst.expression).concat(
            accumulateErrors(inst.args, this.resolveExpr.bind(this)));
    }

    public visitCompile(inst: CompileInst): Errors {
        if (empty(inst.target)) {
            return this.resolveExpr(inst.expression)
        }

        return this.resolveExpr(inst.expression).concat(
            this.resolveExpr(inst.target));
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