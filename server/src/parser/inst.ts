import { IInst, IExpr, IInstVisitor } from './types';
import { IToken } from '../entities/types';
import { Range } from 'vscode-languageserver';
import { empty } from '../utilities/typeGuards';

export abstract class Inst implements IInst {
  get tag(): 'inst' {
    return 'inst';
  }

  public abstract get range(): Range;
  public abstract accept<T>(visitor: IInstVisitor<T>): T;
}

export class BlockInst extends Inst {
  constructor(
    public readonly open: IToken,
    public readonly instructions: Inst[],
    public readonly close: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.open.start,
      end: this.close.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitBlock(this);
  }
}

export class ExprInst extends Inst {
  constructor(
    public readonly suffix: IExpr) {
    super();
  }

  public get range(): Range {
    return this.suffix.range;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitExpr(this);
  }
}

export class OnOffInst extends Inst {
  constructor(
    public readonly suffix: IExpr,
    public readonly onOff: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.suffix.range.start,
      end: this.onOff.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitOnOff(this);
  }
}

export class CommandInst extends Inst {
  constructor(public readonly command: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.command.start,
      end: this.command.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCommand(this);
  }
}

export class CommandExpressionInst extends Inst {
  constructor(
    public readonly command: IToken,
    public readonly expression: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.command.start,
      end: this.expression.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCommandExpr(this);
  }
}

export class UnsetInst extends Inst {
  constructor(
    public readonly unset: IToken,
    public readonly identifier: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.unset.start,
      end: this.identifier.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitUnset(this);
  }
}

export class UnlockInst extends Inst {
  constructor(
    public readonly unlock: IToken,
    public readonly identifier: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.unlock.start,
      end: this.identifier.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitUnlock(this);
  }
}

export class SetInst extends Inst {
  constructor(
    public readonly set: IToken,
    public readonly suffix: IExpr,
    public readonly to: IToken,
    public readonly value: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.set.start,
      end: this.value.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitSet(this);
  }
}

export class LazyGlobalInst extends Inst {
  constructor(
    public readonly atSign: IToken,
    public readonly lazyGlobal: IToken,
    public readonly onOff: IToken) {
    super();
  }

  // public *used(): IterableIterator<IToken> {
  // }

  public get range(): Range {
    return {
      start: this.atSign.start,
      end: this.onOff.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitLazyGlobalInst(this);
  }
}

export class IfInst extends Inst {
  constructor(
    public readonly ifToken: IToken,
    public readonly condition: IExpr,
    public readonly instruction: IInst,
    public readonly elseInst?: IInst) {
    super();
  }

  public get range(): Range {
    return {
      start: this.ifToken.start,
      end: empty(this.elseInst)
        ? this.instruction.range.end
        : this.elseInst.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitIf(this);
  }
}

export class ElseInst extends Inst {
  constructor(
    public readonly elseToken: IToken,
    public readonly instruction: IInst) {
    super();
  }

  public get range(): Range {
    return {
      start: this.elseToken.start,
      end: this.instruction.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitElse(this);
  }
}

export class UntilInst extends Inst {
  constructor(
    public readonly until: IToken,
    public readonly condition: IExpr,
    public readonly instruction: IInst) {
    super();
  }

  public get range(): Range {
    return {
      start: this.until.start,
      end: this.instruction.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitUntil(this);
  }
}

export class FromInst extends Inst {
  constructor(
    public readonly from: IToken,
    public readonly initializer: BlockInst,
    public readonly until: IToken,
    public readonly condition: IExpr,
    public readonly step: IToken,
    public readonly increment: BlockInst,
    public readonly doToken: IToken,
    public readonly instruction: IInst) {
    super();
  }

  public get range(): Range {
    return {
      start: this.from.start,
      end: this.instruction.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitFrom(this);
  }
}

export class WhenInst extends Inst {
  constructor(
    public readonly when: IToken,
    public readonly condition: IExpr,
    public readonly then: IToken,
    public readonly instruction: IInst) {
    super();
  }

  public get range(): Range {
    return {
      start: this.when.start,
      end: this.instruction.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitWhen(this);
  }
}

export class ReturnInst extends Inst {
  constructor(
    public readonly returnToken: IToken,
    public readonly value?: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.returnToken.start,
      end: empty(this.value)
        ? this.returnToken.end
        : this.value.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitReturn(this);
  }
}

export class BreakInst extends Inst {
  constructor(
    public readonly breakToken: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.breakToken.start,
      end: this.breakToken.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitBreak(this);
  }
}

export class SwitchInst extends Inst {
  constructor(
    public readonly switchToken: IToken,
    public readonly to: IToken,
    public readonly target: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.switchToken.start,
      end: this.target.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitSwitch(this);
  }
}

export class ForInst extends Inst {
  constructor(
    public readonly forToken: IToken,
    public readonly identifier: IToken,
    public readonly inToken: IToken,
    public readonly suffix: IExpr,
    public readonly instruction: IInst) {
    super();
  }

  public get range(): Range {
    return {
      start: this.forToken.start,
      end: this.instruction.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitFor(this);
  }
}

export class OnInst extends Inst {
  constructor(
    public readonly on: IToken,
    public readonly suffix: IExpr,
    public readonly instruction: IInst) {
    super();
  }

  public get range(): Range {
    return {
      start: this.on.start,
      end: this.instruction.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitOn(this);
  }
}

export class ToggleInst extends Inst {
  public declared(): IterableIterator<IToken> {
    throw new Error('Method not implemented.');
  }
  constructor(
    public readonly toggle: IToken,
    public readonly suffix: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.toggle.start,
      end: this.suffix.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitToggle(this);
  }
}

export class WaitInst extends Inst {
  constructor(
    public readonly wait: IToken,
    public readonly expression: IExpr,
    public readonly until?: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.wait.start,
      end: this.expression.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitWait(this);
  }
}

export class LogInst extends Inst {
  constructor(
    public readonly log: IToken,
    public readonly expression: IExpr,
    public readonly to: IToken,
    public readonly target: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.log.start,
      end: this.target.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitLog(this);
  }
}

export class CopyInst extends Inst {
  public declared(): IterableIterator<IToken> {
    throw new Error('Method not implemented.');
  }
  constructor(
    public readonly copy: IToken,
    public readonly expression: IExpr,
    public readonly toFrom: IToken,
    public readonly target: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.copy.start,
      end: this.target.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCopy(this);
  }
}

export class RenameInst extends Inst {
  constructor(
    public readonly rename: IToken,
    public readonly ioIdentifer: IToken,
    public readonly expression: IExpr,
    public readonly to: IToken,
    public readonly target: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.rename.start,
      end: this.target.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRename(this);
  }
}

export class DeleteInst extends Inst {
  public declared(): IterableIterator<IToken> {
    throw new Error('Method not implemented.');
  }
  constructor(
    public readonly deleteToken: IToken,
    public readonly expression: IExpr,
    public readonly from?: IToken,
    public readonly target?: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.deleteToken.start,
      end: empty(this.target)
        ? this.expression.range.end
        : this.target.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDelete(this);
  }
}

export class RunInst extends Inst {
  constructor(
    public readonly run: IToken,
    public readonly identifier: IToken,
    public readonly once?: IToken,
    public readonly open?: IToken,
    public readonly args?: IExpr[],
    public readonly close?: IToken,
    public readonly on?: IToken,
    public readonly expr?: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.run.start,
      end: !empty(this.expr)
        ? this.expr.range.end
        : !empty(this.args)
          ? this.args[this.args.length - 1].range.end
          : this.identifier.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRun(this);
  }
}

export class RunPathInst extends Inst {
  constructor(
    public readonly runPath: IToken,
    public readonly open: IToken,
    public readonly expression: IExpr,
    public readonly close: IToken,
    public readonly args?: IExpr[]) {
    super();
  }

  public get range(): Range {
    return {
      start: this.runPath.start,
      end: this.close.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRunPath(this);
  }
}

export class RunPathOnceInst extends Inst {
  constructor(
    public readonly runPath: IToken,
    public readonly open: IToken,
    public readonly expression: IExpr,
    public readonly close: IToken,
    public readonly args?: IExpr[]) {
    super();
  }

  public get range(): Range {
    return {
      start: this.runPath.start,
      end: this.close.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRunPathOnce(this);
  }
}

export class CompileInst extends Inst {
  constructor(
    public readonly compile: IToken,
    public readonly expression: IExpr,
    public readonly to?: IToken,
    public readonly target?: IExpr) {
    super();
  }

  public get range(): Range {
    return {
      start: this.compile.start,
      end: empty(this.target)
        ? this.expression.range.end
        : this.target.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCompile(this);
  }
}

export class ListInst extends Inst {
  constructor(
    public readonly list: IToken,
    public readonly identifier?: IToken,
    public readonly inToken?: IToken,
    public readonly target?: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.list.start,
      end: !empty(this.target)
        ? this.target.end
        : !empty(this.identifier)
          ? this.identifier.end
          : this.list.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitList(this);
  }
}

export class EmptyInst extends Inst {
  constructor(public readonly empty: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.empty.start,
      end: this.empty.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitEmpty(this);
  }
}

export class PrintInst extends Inst {
  constructor(
    public readonly print: IToken,
    public readonly expression: IExpr,
    public readonly at?: IToken,
    public readonly open?: IToken,
    public readonly x?: IExpr,
    public readonly y?: IExpr,
    public readonly close?: IToken) {
    super();
  }

  public get range(): Range {
    return {
      start: this.print.start,
      end: empty(this.close)
        ? this.expression.range.end
        : this.close.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitPrint(this);
  }
}
