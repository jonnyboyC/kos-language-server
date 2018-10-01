import { IInstVisitor, IExprVisitor } from "../parser/types";
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
import { IScope, IStack } from "./types";
import { TokenType } from "../scanner/tokentypes";
import { ResolverError } from "./resolverError";
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from "../parser/declare";

type Errors = Array<ResolverError>

export class Resolver implements IExprVisitor<Errors>, IInstVisitor<Errors> {
    private readonly _insts: Inst[];
    private readonly _scopes: IStack<IScope>;
    private _lazyGlobalOff: boolean;
    private _firstInst: boolean;

    constructor(insts: Inst[]) {
        this._insts = insts;
        this._scopes = [];
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

    // push new scope onto scope stack
    private beginScope(): void {
        this._scopes.push({});
    }

    private endScope(): void {
        const scope = this._scopes.pop();

        if (scope) {
            // do stuff
        }
    }

    /* --------------------------------------------

    Instructions

    ----------------------------------------------*/

    public visitDeclVariable(decl: DeclVariable): ResolverError[] {
        throw new Error("Method not implemented.");
    }

    public visitDeclLock(decl: DeclLock): ResolverError[] {
        throw new Error("Method not implemented.");
    }

    public visitDeclFunction(decl: DeclFunction): ResolverError[] {
        throw new Error("Method not implemented.");
    }

    public visitDeclParameter(decl: DeclParameter): ResolverError[] {
        throw new Error("Method not implemented.");
    }

    public visitBlock(inst: BlockInst): Errors {
        this.beginScope();
        const possibleErrors = this.resolveInsts(inst.instructions);
        this.endScope();

        return possibleErrors;
    }
    public visitExpr(inst: ExprInst): Errors {
        return this.resolveExpr(inst.suffix);
    }
    public visitOnOff(inst: OnOffInst): Errors {
        throw new Error("Method not implemented.");
    }
    public visitCommand(inst: CommandInst): Errors {
        return [];
    }
    public visitCommandExpr(inst: CommandExpressionInst): Errors {
        return this.resolveExpr(inst.expression);
    }
    public visitUnset(inst: UnsetInst): Errors {
        throw new Error("Method not implemented.");
    }
    public visitUnlock(inst: UnlockInst): Errors {
        throw new Error("Method not implemented.");
    }
    public visitSet(inst: SetInst): Errors {
        throw new Error("Method not implemented.");
    }
    public visitLazyGlobalInst(inst: LazyGlobalInst): Errors {
        if (!this._firstInst) {
            // error thing
            return [new ResolverError()]
        }
    
        this._lazyGlobalOff = inst.onOff.type === TokenType.Off;
        return [];
    }
    public visitIf(inst: IfInst): Errors {
        let possibleErrors = this.resolveExpr(inst.condition)
            .concat(this.resolveInst(inst.instruction));

        if (inst.elseInst) {
            possibleErrors = possibleErrors.concat(
                this.resolveInst(inst.elseInst));
        }

        return possibleErrors;
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
        // TODO indentifer logic

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
        // TODO identifier logic

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
        let possibleErrors = this.resolveExpr(inst.expression);
        if (inst.args) {
            possibleErrors.concat(
                accumulateErrors(inst.args, this.resolveExpr.bind(this)));
        }

        return possibleErrors;
    }
    public visitRunPathOnce(inst: RunPathOnceInst): Errors {
        let possibleErrors = this.resolveExpr(inst.expression);
        if (inst.args) {
            possibleErrors.concat(
                accumulateErrors(inst.args, this.resolveExpr.bind(this)));
        }

        return possibleErrors;
    }
    public visitCompile(inst: CompileInst): Errors {
        return this.resolveExpr(inst.expression)
            .concat(inst.target ? this.resolveExpr(inst.target) : []);
    }
    public visitList(inst: ListInst): Errors {
        // TODO identifier

        return [];
    }
    public visitEmpty(inst: EmptyInst): Errors {
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
        throw new Error("Method not implemented.");
    }
    public visitDelegate(expr: DelegateExpr): Errors {
        throw new Error("Method not implemented.");
    }
    public visitLiteral(expr: LiteralExpr): Errors {
        throw new Error("Method not implemented.");
    }
    public visitVariable(expr: VariableExpr): Errors {
        throw new Error("Method not implemented.");
    }
    public visitGrouping(expr: GroupingExpr): Errors {
        throw new Error("Method not implemented.");
    }
    public visitAnonymousFunction(expr: AnonymousFunctionExpr): Errors {
        throw new Error("Method not implemented.");
    }
}

const accumulateErrors = <T>(items: Array<T>, checker: (item: T) => Errors): Errors => {
    return items.reduce((accumulator, item) => 
        accumulator.concat(checker(item)),
        [] as Errors);
} 