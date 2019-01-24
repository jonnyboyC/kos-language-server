import { IExprVisitor, IInstVisitor } from '../parser/types';
import {
  InvalidExpr, BinaryExpr,
  UnaryExpr, FactorExpr, SuffixExpr,
  CallExpr, ArrayIndexExpr, ArrayBracketExpr,
  DelegateExpr, LiteralExpr, VariableExpr,
  GroupingExpr, AnonymousFunctionExpr,
} from '../parser/expr';
import { ITypeError } from './types';
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from '../parser/declare';
import { InvalidInst, BlockInst, ExprInst, OnOffInst,
  CommandInst, CommandExpressionInst, UnsetInst,
  UnlockInst, SetInst, LazyGlobalInst, IfInst,
  ElseInst, UntilInst, FromInst, WhenInst,
  ReturnInst, BreakInst, SwitchInst, ForInst,
  OnInst, ToggleInst, WaitInst, LogInst, CopyInst,
  RenameInst, DeleteInst, RunInst, RunPathInst,
  RunPathOnceInst, CompileInst, ListInst,
  EmptyInst, PrintInst,
} from '../parser/inst';
import { mockLogger, mockTracer } from '../utilities/logger';
import { SyntaxTree } from '../entities/syntaxTree';
import { ScopeManager } from '../analysis/scopeManager';

type TypeErrors = ITypeError[];

export class TypeChcker implements IExprVisitor<TypeErrors>, IInstVisitor<TypeErrors> {
  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly syntaxTree: SyntaxTree;
  private readonly scopeManager: ScopeManager;

  constructor(
    syntaxTree: SyntaxTree,
    scopeManager: ScopeManager,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer) {
    this.syntaxTree = syntaxTree;
    this.scopeManager = scopeManager;
    this.logger = logger;
    this.tracer = tracer;

    if (this.syntaxTree) {
      console.log('');
    }

    if (this.scopeManager) {
      console.log('');
    }

    if (this.logger) {
      console.log('');
    }

    if (this.tracer) {
      console.log('');
    }
  }

  visitDeclVariable(decl: DeclVariable): TypeErrors {
    console.log(decl);
    return [];
  }
  visitDeclLock(decl: DeclLock): TypeErrors {
    console.log(decl);
    return [];
  }
  visitDeclFunction(decl: DeclFunction): TypeErrors {
    console.log(decl);
    return [];
  }
  visitDeclParameter(decl: DeclParameter): TypeErrors {
    console.log(decl);
    return [];
  }
  visitInstInvalid(inst: InvalidInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitBlock(inst: BlockInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitExpr(inst: ExprInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitOnOff(inst: OnOffInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitCommand(inst: CommandInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitCommandExpr(inst: CommandExpressionInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitUnset(inst: UnsetInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitUnlock(inst: UnlockInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitSet(inst: SetInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitLazyGlobalInst(inst: LazyGlobalInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitIf(inst: IfInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitElse(inst: ElseInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitUntil(inst: UntilInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitFrom(inst: FromInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitWhen(inst: WhenInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitReturn(inst: ReturnInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitBreak(inst: BreakInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitSwitch(inst: SwitchInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitFor(inst: ForInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitOn(inst: OnInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitToggle(inst: ToggleInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitWait(inst: WaitInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitLog(inst: LogInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitCopy(inst: CopyInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitRename(inst: RenameInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitDelete(inst: DeleteInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitRun(inst: RunInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitRunPath(inst: RunPathInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitRunPathOnce(inst: RunPathOnceInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitCompile(inst: CompileInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitList(inst: ListInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitEmpty(inst: EmptyInst): TypeErrors {
    console.log(inst);
    return [];
  }
  visitPrint(inst: PrintInst): TypeErrors {
    console.log(inst);
    return [];
  }

  visitExprInvalid(expr: InvalidExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitBinary(expr: BinaryExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitUnary(expr: UnaryExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitFactor(expr: FactorExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitSuffix(expr: SuffixExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitCall(expr: CallExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitArrayIndex(expr: ArrayIndexExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitArrayBracket(expr: ArrayBracketExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitDelegate(expr: DelegateExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitLiteral(expr: LiteralExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitVariable(expr: VariableExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitGrouping(expr: GroupingExpr): TypeErrors {
    console.log(expr);
    return [];
  }
  visitAnonymousFunction(expr: AnonymousFunctionExpr): TypeErrors {
    console.log(expr);
    return [];
  }
}
