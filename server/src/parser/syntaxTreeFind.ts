import { IExprVisitor, IInstVisitor, IInst, IExpr, IFindResult, INode } from './types';
import { IToken } from '../entities/types';
import { DeclVariable, DeclLock, DeclFunction, DeclParameter } from './declare';
import {
  BlockInst, ExprInst, OnOffInst,
  CommandInst, CommandExpressionInst,
  UnsetInst, UnlockInst, SetInst,
  LazyGlobalInst, IfInst, ElseInst,
  UntilInst, FromInst, WhenInst, ReturnInst,
  BreakInst, SwitchInst, ForInst, OnInst,
  ToggleInst, WaitInst, LogInst, CopyInst,
  RenameInst, DeleteInst, RunInst,
  RunPathInst, RunPathOnceInst, CompileInst,
  ListInst, EmptyInst, PrintInst, Inst, InvalidInst,
} from './inst';
import {
  BinaryExpr, UnaryExpr, FactorExpr, SuffixExpr,
  CallExpr, ArrayIndexExpr, ArrayBracketExpr,
  DelegateExpr, LiteralExpr, VariableExpr,
  GroupingExpr, AnonymousFunctionExpr, Expr, InvalidExpr,
} from './expr';
import { Position } from 'vscode-languageserver';
import { binarySearch } from '../utilities/positionHelpers';
import { empty } from '../utilities/typeGuards';
import { Token } from '../entities/token';

export class SyntaxTreeFind implements
  IExprVisitor<Maybe<IFindResult>>,
  IInstVisitor<Maybe<IFindResult>> {

  private pos: Position;
  private context: Maybe<Function>;

  constructor() {
    this.pos = {
      line: 0,
      character: 0,
    };
    this.context = undefined;
  }

  public find(syntaxNode: INode, pos: Position, context?: Function): Maybe<IFindResult> {
    this.pos = pos;
    this.context = context;
    return this.findNode(syntaxNode);
  }

  private findNode(node: INode): Maybe<IFindResult> {
    const searchResult = binarySearch(node.ranges, this.pos);
    if (empty(searchResult)) {
      return searchResult;
    }

    // search expression if expression
    if (searchResult instanceof Expr) {
      const findResult = this.findExpr(searchResult);

      // add context if not set yet
      if (!empty(findResult) && this.addContext(findResult, node)) {
        findResult.node = node;
      }

      return findResult;
    }

    // search instruction if instruction
    if (searchResult instanceof Inst) {
      const findResult = this.findInst(searchResult);

      // add context if not set yet
      if (!empty(findResult) && this.addContext(findResult, node)) {
        findResult.node = node;
      }

      return findResult;
    }

    // return result if token found
    if (searchResult instanceof Token) {
      return {
        node: this.isContext(node)
          ? node
          : undefined,
        token: searchResult as IToken,
      };
    }

    throw new Error('Unexpected result found.');
  }

  private addContext(findResult: IFindResult, node: INode): boolean {
    return empty(findResult.node) && this.isContext(node);
  }

  private isContext(node: INode): boolean {
    return !empty(this.context) && node instanceof this.context;
  }

  // find an instruction
  private findInst(inst: IInst): Maybe<IFindResult> {
    return inst.accept(this);
  }

  // find an expression
  private findExpr(expr: IExpr): Maybe<IFindResult> {
    return expr.accept(this);
  }

  visitDeclVariable(decl: DeclVariable): Maybe<IFindResult> {
    return this.findNode(decl);
  }
  visitDeclLock(decl: DeclLock): Maybe<IFindResult> {
    return this.findNode(decl);
  }
  visitDeclFunction(decl: DeclFunction): Maybe<IFindResult> {
    return this.findNode(decl);
  }
  visitDeclParameter(decl: DeclParameter): Maybe<IFindResult> {
    return this.findNode(decl);
  }
  visitInstInvalid(inst: InvalidInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitBlock(inst: BlockInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitExpr(inst: ExprInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitOnOff(inst: OnOffInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitCommand(inst: CommandInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitCommandExpr(inst: CommandExpressionInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitUnset(inst: UnsetInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitUnlock(inst: UnlockInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitSet(inst: SetInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitLazyGlobalInst(inst: LazyGlobalInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitIf(inst: IfInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitElse(inst: ElseInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitUntil(inst: UntilInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitFrom(inst: FromInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitWhen(inst: WhenInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitReturn(inst: ReturnInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitBreak(inst: BreakInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitSwitch(inst: SwitchInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitFor(inst: ForInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitOn(inst: OnInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitToggle(inst: ToggleInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitWait(inst: WaitInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitLog(inst: LogInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitCopy(inst: CopyInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitRename(inst: RenameInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitDelete(inst: DeleteInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitRun(inst: RunInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitRunPath(inst: RunPathInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitRunPathOnce(inst: RunPathOnceInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitCompile(inst: CompileInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitList(inst: ListInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitEmpty(inst: EmptyInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitPrint(inst: PrintInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  visitExprInvalid(expr: InvalidExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitBinary(expr: BinaryExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitUnary(expr: UnaryExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitFactor(expr: FactorExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitSuffix(expr: SuffixExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitCall(expr: CallExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitArrayIndex(expr: ArrayIndexExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitArrayBracket(expr: ArrayBracketExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitDelegate(expr: DelegateExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitLiteral(expr: LiteralExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitVariable(expr: VariableExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitGrouping(expr: GroupingExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  visitAnonymousFunction(expr: AnonymousFunctionExpr): Maybe<IFindResult> {
    return this.findNode(expr);
  }
}
