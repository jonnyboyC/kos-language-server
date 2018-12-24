import { IExprVisitor, IInstVisitor, IInst, IExpr } from './types';
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
  ListInst, EmptyInst, PrintInst,
} from './inst';
import {
  BinaryExpr, UnaryExpr, FactorExpr, SuffixExpr,
  CallExpr, ArrayIndexExpr, ArrayBracketExpr,
  DelegateExpr, LiteralExpr, VariableExpr,
  GroupingExpr, AnonymousFunctionExpr,
} from './expr';
import { SyntaxTree } from '../entities/syntaxTree';
import { Position, Range } from 'vscode-languageserver';
import { rangeBefore, rangeAfter, rangeContains } from '../utilities/positionHelpers';

export class SyntaxTreeFind implements IExprVisitor<Maybe<IToken>>, IInstVisitor<Maybe<IToken>> {

  private pos: Position;
  private syntaxTree: SyntaxTree;

  constructor(syntaxTree: SyntaxTree) {
    this.syntaxTree = syntaxTree;
    this.pos = {
      line: 0,
      character: 0,
    };
  }

  find(pos: Position): Maybe<IToken> {
    this.pos = pos;
    const inst = this.binarySearch(this.syntaxTree.insts, pos);
    return inst && this.findInst(inst);
  }

  // find an instruction
  private findInst(inst: IInst): Maybe<IToken> {
    return inst.accept(this);
  }

  // find an expression
  private findExpr(expr: IExpr): Maybe<IToken> {
    return expr.accept(this);
  }

  // binary search a ast or block of instructions
  private binarySearch<T extends Range>(insts: T[], pos: Position): Maybe<T> {
    let left = 0;
    let right = insts.length - 1;

    while (left <= right) {
      const mid = Math.floor((right + left) / 2);
      if (rangeBefore(insts[mid], pos)) {
        left = mid + 1;
      } else if (rangeAfter(insts[mid], pos)) {
        right = mid - 1;
      } else if (rangeContains(insts[mid], pos)) {
        return insts[mid];
      } else {
        return undefined;
      }
    }

    return undefined;
  }

  visitDeclVariable(decl: DeclVariable): Maybe<IToken> {
    if (rangeContains(decl.toIs, this.pos)) {
      return decl.toIs;
    }

    if (rangeBefore(decl.toIs, ))

    throw new Error('Method not implemented.');
  }
  visitDeclLock(decl: DeclLock): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitDeclFunction(decl: DeclFunction): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitDeclParameter(decl: DeclParameter): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitBlock(inst: BlockInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitExpr(inst: ExprInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitOnOff(inst: OnOffInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCommand(inst: CommandInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCommandExpr(inst: CommandExpressionInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitUnset(inst: UnsetInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitUnlock(inst: UnlockInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitSet(inst: SetInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitLazyGlobalInst(inst: LazyGlobalInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitIf(inst: IfInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitElse(inst: ElseInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitUntil(inst: UntilInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitFrom(inst: FromInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitWhen(inst: WhenInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitReturn(inst: ReturnInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitBreak(inst: BreakInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitSwitch(inst: SwitchInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitFor(inst: ForInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitOn(inst: OnInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitToggle(inst: ToggleInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitWait(inst: WaitInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitLog(inst: LogInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCopy(inst: CopyInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitRename(inst: RenameInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitDelete(inst: DeleteInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitRun(inst: RunInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitRunPath(inst: RunPathInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitRunPathOnce(inst: RunPathOnceInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCompile(inst: CompileInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitList(inst: ListInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitEmpty(inst: EmptyInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitPrint(inst: PrintInst): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitBinary(expr: BinaryExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitUnary(expr: UnaryExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitFactor(expr: FactorExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitSuffix(expr: SuffixExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitCall(expr: CallExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitArrayIndex(expr: ArrayIndexExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitArrayBracket(expr: ArrayBracketExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitDelegate(expr: DelegateExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitLiteral(expr: LiteralExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitVariable(expr: VariableExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitGrouping(expr: GroupingExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
  visitAnonymousFunction(expr: AnonymousFunctionExpr): Maybe<IToken> {
    throw new Error('Method not implemented.');
  }
}
