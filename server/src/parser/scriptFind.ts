import {
  IExprVisitor, IInstVisitor, IInst,
  IExpr, IFindResult, TreeNode,
  ISuffixTermVisitor,
  ISuffixTerm,
} from './types';
import * as Decl from './declare';
import * as Inst from './inst';
import * as Expr from './expr';
import * as SuffixTerm from './suffixTerm';
import { Position } from 'vscode-languageserver';
import { binarySearch } from '../utilities/positionHelpers';
import { empty } from '../utilities/typeGuards';
import { Token } from '../entities/token';

type Contexts = Constructor<Expr.Expr>
  | Constructor<Inst.Inst>
  | Constructor<SuffixTerm.SuffixTermBase>
  | Constructor<Decl.Parameter>;

export class ScriptFind implements
  IExprVisitor<Maybe<IFindResult>>,
  IInstVisitor<Maybe<IFindResult>>,
  ISuffixTermVisitor<Maybe<IFindResult>> {

  private pos: Position;
  private contexts: Contexts[];

  constructor() {
    this.pos = {
      line: 0,
      character: 0,
    };
    this.contexts = [];
  }

  public find(syntaxNode: TreeNode, pos: Position, ...contexts: Contexts[]): Maybe<IFindResult> {
    this.pos = pos;
    this.contexts = contexts;
    return this.findNode(syntaxNode);
  }

  private findNode(node: TreeNode): Maybe<IFindResult> {
    const searchResult = binarySearch(node.ranges, this.pos);
    if (empty(searchResult)) {
      return searchResult;
    }

    // search expression if expression
    if (searchResult instanceof SuffixTerm.SuffixTermBase) {
      const findResult = this.findSuffixTerm(searchResult);

      // add context if not set yet
      if (!empty(findResult) && this.addContext(findResult, node)) {
        findResult.node = node;
      }

      return findResult;
    }

    // search expression if expression
    if (searchResult instanceof Expr.Expr) {
      const findResult = this.findExpr(searchResult);

      // add context if not set yet
      if (!empty(findResult) && this.addContext(findResult, node)) {
        findResult.node = node;
      }

      return findResult;
    }

    // search instruction if instruction
    if (searchResult instanceof Inst.Inst) {
      const findResult = this.findInst(searchResult);

      // add context if not set yet
      if (!empty(findResult) && this.addContext(findResult, node)) {
        findResult.node = node;
      }

      return findResult;
    }

    if (searchResult instanceof Decl.Parameter) {
      return {
        node: this.isContext(node)
          ? node
          : this.isContext(searchResult)
            ? searchResult
            : undefined,
        token: searchResult.identifier,
      };
    }

    // return result if token found
    if (searchResult instanceof Token) {
      return {
        node: this.isContext(node)
          ? node
          : undefined,
        token: searchResult,
      };
    }

    throw new Error('Unexpected result found.');
  }

  private addContext(findResult: IFindResult, node: TreeNode): boolean {
    return empty(findResult.node) && this.isContext(node);
  }

  // is the correct context
  private isContext(node: TreeNode): boolean {
    return this.contexts.some(context => node instanceof context);
  }

  // find an instruction
  private findInst(inst: IInst): Maybe<IFindResult> {
    return inst.accept(this);
  }

  // find an expression
  private findExpr(expr: IExpr): Maybe<IFindResult> {
    return expr.accept(this);
  }

  // find an expression
  private findSuffixTerm(suffixTerm: ISuffixTerm): Maybe<IFindResult> {
    return suffixTerm.accept(this);
  }

  public visitDeclVariable(decl: Decl.Var): Maybe<IFindResult> {
    return this.findNode(decl);
  }
  public visitDeclLock(decl: Decl.Lock): Maybe<IFindResult> {
    return this.findNode(decl);
  }
  public visitDeclFunction(decl: Decl.Func): Maybe<IFindResult> {
    return this.findNode(decl);
  }
  public visitDeclParameter(decl: Decl.Param): Maybe<IFindResult> {
    return this.findNode(decl);
  }
  public visitInstInvalid(inst: Inst.Invalid): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitBlock(inst: Inst.Block): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitExpr(inst: Inst.ExprInst): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitOnOff(inst: Inst.OnOff): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitCommand(inst: Inst.Command): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitCommandExpr(inst: Inst.CommandExpr): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitUnset(inst: Inst.Unset): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitUnlock(inst: Inst.Unlock): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitSet(inst: Inst.Set): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitLazyGlobalInst(inst: Inst.LazyGlobal): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitIf(inst: Inst.If): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitElse(inst: Inst.Else): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitUntil(inst: Inst.Until): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitFrom(inst: Inst.From): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitWhen(inst: Inst.When): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitReturn(inst: Inst.Return): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitBreak(inst: Inst.Break): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitSwitch(inst: Inst.Switch): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitFor(inst: Inst.For): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitOn(inst: Inst.On): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitToggle(inst: Inst.Toggle): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitWait(inst: Inst.Wait): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitLog(inst: Inst.Log): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitCopy(inst: Inst.Copy): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitRename(inst: Inst.Rename): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitDelete(inst: Inst.Delete): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitRun(inst: Inst.Run): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitRunPath(inst: Inst.RunPath): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitRunPathOnce(inst: Inst.RunPathOnce): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitCompile(inst: Inst.Compile): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitList(inst: Inst.List): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitEmpty(inst: Inst.Empty): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitPrint(inst: Inst.Print): Maybe<IFindResult> {
    return this.findNode(inst);
  }
  public visitExprInvalid(expr: Expr.Invalid): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  public visitBinary(expr: Expr.Binary): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  public visitUnary(expr: Expr.Unary): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  public visitFactor(expr: Expr.Factor): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  public visitSuffix(expr: Expr.Suffix): Maybe<IFindResult> {
    return this.findNode(expr);
  }
  public visitSuffixTrailer(suffixTerm: SuffixTerm.SuffixTrailer): Maybe<IFindResult> {
    return this.findNode(suffixTerm);
  }
  public visitSuffixTerm(suffixTerm: SuffixTerm.SuffixTerm): Maybe<IFindResult> {
    return this.findNode(suffixTerm);
  }
  public visitCall(suffixTerm: SuffixTerm.Call): Maybe<IFindResult> {
    return this.findNode(suffixTerm);
  }
  public visitArrayIndex(suffixTerm: SuffixTerm.ArrayIndex): Maybe<IFindResult> {
    return this.findNode(suffixTerm);
  }
  public visitArrayBracket(suffixTerm: SuffixTerm.ArrayBracket): Maybe<IFindResult> {
    return this.findNode(suffixTerm);
  }
  public visitDelegate(suffixTerm: SuffixTerm.Delegate): Maybe<IFindResult> {
    return this.findNode(suffixTerm);
  }
  public visitLiteral(suffixTerm: SuffixTerm.Literal): Maybe<IFindResult> {
    return this.findNode(suffixTerm);
  }
  public visitIdentifier(suffixTerm: SuffixTerm.Identifier): Maybe<IFindResult> {
    return this.findNode(suffixTerm);
  }
  public visitGrouping(suffixTerm: SuffixTerm.Grouping): Maybe<IFindResult> {
    return this.findNode(suffixTerm);
  }
  public visitAnonymousFunction(expr: Expr.AnonymousFunction): Maybe<IFindResult> {
    return this.findNode(expr);
  }
}
