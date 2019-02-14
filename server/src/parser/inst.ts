import { IInst, IExpr, IInstVisitor, ISuffix } from './types';
import { IToken } from '../entities/types';
import { Range, Position } from 'vscode-languageserver';
import { empty } from '../utilities/typeGuards';

export abstract class Inst implements IInst {
  get tag(): 'inst' {
    return 'inst';
  }

  public abstract get ranges(): Range[];
  public abstract get start(): Position;
  public abstract get end(): Position;
  public abstract accept<T>(visitor: IInstVisitor<T>): T;
}

export class Invalid extends Inst {
  constructor(public readonly tokens: IToken[]) {
    super();
  }

  public get start(): Position {
    return this.tokens[0].start;
  }

  public get end(): Position {
    return this.tokens[this.tokens.length - 1].end;
  }

  public get ranges(): Range[] {
    return [...this.tokens];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitInstInvalid(this);
  }
}

export class Block extends Inst {
  constructor(
    public readonly open: IToken,
    public readonly instructions: Inst[],
    public readonly close: IToken) {
    super();
  }

  public get start(): Position {
    return this.open.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    return [this.open, ...this.instructions, this.close];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitBlock(this);
  }
}

export class Expr extends Inst {
  constructor(
    public readonly suffix: ISuffix) {
    super();
  }

  public get start(): Position {
    return this.suffix.start;
  }

  public get end(): Position {
    return this.suffix.end;
  }

  public get ranges(): Range[] {
    return [this.suffix];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitExpr(this);
  }
}

export class OnOff extends Inst {
  constructor(
    public readonly suffix: IExpr,
    public readonly onOff: IToken) {
    super();
  }

  public get start(): Position {
    return this.suffix.start;
  }

  public get end(): Position {
    return this.onOff.end;
  }

  public get ranges(): Range[] {
    return [this.suffix, this.onOff];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitOnOff(this);
  }
}

export class Command extends Inst {
  constructor(public readonly command: IToken) {
    super();
  }

  public get start(): Position {
    return this.command.start;
  }

  public get end(): Position {
    return this.command.end;
  }

  public get ranges(): Range[] {
    return [this.command];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCommand(this);
  }
}

export class CommandExpr extends Inst {
  constructor(
    public readonly command: IToken,
    public readonly expression: IExpr) {
    super();
  }

  public get start(): Position {
    return this.command.start;
  }

  public get end(): Position {
    return this.expression.end;
  }

  public get ranges(): Range[] {
    return [this.command, this.expression];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCommandExpr(this);
  }
}

export class Unset extends Inst {
  constructor(
    public readonly unset: IToken,
    public readonly identifier: IToken) {
    super();
  }

  public get start(): Position {
    return this.unset.start;
  }

  public get end(): Position {
    return this.identifier.end;
  }

  public get ranges(): Range[] {
    return [this.unset, this.identifier];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitUnset(this);
  }
}

export class Unlock extends Inst {
  constructor(
    public readonly unlock: IToken,
    public readonly identifier: IToken) {
    super();
  }

  public get start(): Position {
    return this.unlock.start;
  }

  public get end(): Position {
    return this.identifier.end;
  }

  public get ranges(): Range[] {
    return [this.unlock, this.identifier];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitUnlock(this);
  }
}

export class Set extends Inst {
  constructor(
    public readonly set: IToken,
    public readonly suffix: ISuffix,
    public readonly to: IToken,
    public readonly value: IExpr) {
    super();
  }

  public get start(): Position {
    return this.set.start;
  }

  public get end(): Position {
    return this.value.end;
  }

  public get ranges(): Range[] {
    return [this.set, this.suffix, this.to, this.value];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitSet(this);
  }
}

export class LazyGlobal extends Inst {
  constructor(
    public readonly atSign: IToken,
    public readonly lazyGlobal: IToken,
    public readonly onOff: IToken) {
    super();
  }

  public get start(): Position {
    return this.atSign.start;
  }

  public get end(): Position {
    return this.onOff.end;
  }

  public get ranges(): Range[] {
    return [this.atSign, this.lazyGlobal, this.onOff];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitLazyGlobalInst(this);
  }
}

export class If extends Inst {
  constructor(
    public readonly ifToken: IToken,
    public readonly condition: IExpr,
    public readonly instruction: IInst,
    public readonly elseInst?: IInst) {
    super();
  }

  public get start(): Position {
    return this.ifToken.start;
  }

  public get end(): Position {
    return empty(this.elseInst)
    ? this.instruction.end
    : this.elseInst.end;
  }

  public get ranges(): Range[] {
    const ranges = [this.ifToken, this.condition, this.instruction];
    if (!empty(this.elseInst)) {
      ranges.push(this.elseInst);
    }

    return ranges;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitIf(this);
  }
}

export class Else extends Inst {
  constructor(
    public readonly elseToken: IToken,
    public readonly instruction: IInst) {
    super();
  }

  public get start(): Position {
    return this.elseToken.start;
  }

  public get end(): Position {
    return this.instruction.end;
  }

  public get ranges(): Range[] {
    return [this.elseToken, this.instruction];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitElse(this);
  }
}

export class Until extends Inst {
  constructor(
    public readonly until: IToken,
    public readonly condition: IExpr,
    public readonly instruction: IInst) {
    super();
  }

  public get start(): Position {
    return this.until.start;
  }

  public get end(): Position {
    return this.instruction.end;
  }

  public get ranges(): Range[] {
    return [this.until, this.condition, this.instruction];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitUntil(this);
  }
}

export class From extends Inst {
  constructor(
    public readonly from: IToken,
    public readonly initializer: Block,
    public readonly until: IToken,
    public readonly condition: IExpr,
    public readonly step: IToken,
    public readonly increment: Block,
    public readonly doToken: IToken,
    public readonly instruction: IInst) {
    super();
  }

  public get start(): Position {
    return this.from.start;
  }

  public get end(): Position {
    return this.instruction.end;
  }

  public get ranges(): Range[] {
    return [
      this.from, this.initializer,
      this.until, this.condition,
      this.step, this.increment,
      this.doToken, this.instruction,
    ];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitFrom(this);
  }
}

export class When extends Inst {
  constructor(
    public readonly when: IToken,
    public readonly condition: IExpr,
    public readonly then: IToken,
    public readonly instruction: IInst) {
    super();
  }

  public get start(): Position {
    return this.when.start;
  }

  public get end(): Position {
    return this.instruction.end;
  }

  public get ranges(): Range[] {
    return [
      this.when, this.condition,
      this.then, this.instruction,
    ];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitWhen(this);
  }
}

export class Return extends Inst {
  constructor(
    public readonly returnToken: IToken,
    public readonly value?: IExpr) {
    super();
  }

  public get start(): Position {
    return this.returnToken.start;
  }

  public get end(): Position {
    return empty(this.value)
      ? this.returnToken.end
      : this.value.end;
  }

  public get ranges(): Range[] {
    let ranges: Range[] = [this.returnToken];
    if (!empty(this.value)) {
      ranges = ranges.concat(this.value.ranges);
    }

    return ranges;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitReturn(this);
  }
}

export class Break extends Inst {
  constructor(
    public readonly breakToken: IToken) {
    super();
  }

  public get start(): Position {
    return this.breakToken.start;
  }

  public get end(): Position {
    return this.breakToken.end;
  }

  public get ranges(): Range[] {
    return [this.breakToken];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitBreak(this);
  }
}

export class Switch extends Inst {
  constructor(
    public readonly switchToken: IToken,
    public readonly to: IToken,
    public readonly target: IExpr) {
    super();
  }

  public get start(): Position {
    return this.switchToken.start;
  }

  public get end(): Position {
    return this.target.end;
  }

  public get ranges(): Range[] {
    return [this.switchToken, this.to, this.target];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitSwitch(this);
  }
}

export class For extends Inst {
  constructor(
    public readonly forToken: IToken,
    public readonly identifier: IToken,
    public readonly inToken: IToken,
    public readonly suffix: ISuffix,
    public readonly instruction: IInst) {
    super();
  }

  public get start(): Position {
    return this.forToken.start;
  }

  public get end(): Position {
    return this.instruction.end;
  }

  public get ranges(): Range[] {
    return [
      this.forToken, this.identifier,
      this.inToken, this.suffix,
      this.instruction,
    ];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitFor(this);
  }
}

export class On extends Inst {
  constructor(
    public readonly on: IToken,
    public readonly suffix: ISuffix,
    public readonly instruction: IInst) {
    super();
  }

  public get start(): Position {
    return this.on.start;
  }

  public get end(): Position {
    return this.instruction.end;
  }

  public get ranges(): Range[] {
    return [this.on, this.suffix, this.instruction];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitOn(this);
  }
}

export class Toggle extends Inst {
  public declared(): IterableIterator<IToken> {
    throw new Error('Method not implemented.');
  }
  constructor(
    public readonly toggle: IToken,
    public readonly suffix: ISuffix) {
    super();
  }

  public get start(): Position {
    return this.toggle.start;
  }

  public get end(): Position {
    return this.suffix.end;
  }

  public get ranges(): Range[] {
    return [this.toggle, this.suffix];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitToggle(this);
  }
}

export class Wait extends Inst {
  constructor(
    public readonly wait: IToken,
    public readonly expression: IExpr,
    public readonly until?: IToken) {
    super();
  }

  public get start(): Position {
    return this.wait.start;
  }

  public get end(): Position {
    return this.expression.end;
  }

  public get ranges(): Range[] {
    if (empty(this.until)) {
      return [this.wait, this.expression];
    }

    return [this.wait, this.until, this.expression];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitWait(this);
  }
}

export class Log extends Inst {
  constructor(
    public readonly log: IToken,
    public readonly expression: IExpr,
    public readonly to: IToken,
    public readonly target: IExpr) {
    super();
  }

  public get start(): Position {
    return this.log.start;
  }

  public get end(): Position {
    return this.target.end;
  }

  public get ranges(): Range[] {
    return [this.log, this.expression, this.to, this.target];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitLog(this);
  }
}

export class Copy extends Inst {
  constructor(
    public readonly copy: IToken,
    public readonly source: IExpr,
    public readonly toFrom: IToken,
    public readonly target: IExpr) {
    super();
  }

  public get start(): Position {
    return this.copy.start;
  }

  public get end(): Position {
    return this.target.end;
  }

  public get ranges(): Range[] {
    return [this.copy, this.source, this.toFrom, this.target];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCopy(this);
  }
}

export class Rename extends Inst {
  constructor(
    public readonly rename: IToken,
    public readonly fileVolume: IToken,
    public readonly ioIdentifer: IToken,
    public readonly source: IExpr,
    public readonly to: IToken,
    public readonly target: IExpr) {
    super();
  }

  public get start(): Position {
    return this.rename.start;
  }

  public get end(): Position {
    return this.target.end;
  }

  public get ranges(): Range[] {
    return [
      this.rename, this.ioIdentifer,
      this.source, this.to,
      this.target,
    ];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRename(this);
  }
}

export class Delete extends Inst {
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

  public get start(): Position {
    return this.deleteToken.start;
  }

  public get end(): Position {
    return empty(this.target)
      ? this.expression.end
      : this.target.end;
  }

  public get ranges(): Range[] {
    const ranges = [this.deleteToken, this.expression];
    if (!empty(this.from) && !empty(this.target)) {
      ranges.push(this.from);
      ranges.push(this.target);
    }

    return ranges;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDelete(this);
  }
}

export class Run extends Inst {
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

  public get start(): Position {
    return this.run.start;
  }

  public get end(): Position {
    return !empty(this.expr)
      ? this.expr.end
      : !empty(this.args)
        ? this.args[this.args.length - 1].end
        : this.identifier.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.run];
    if (!empty(this.once)) {
      ranges.push(this.once);
    }
    ranges.push(this.identifier);
    if (!empty(this.open) && !empty(this.args) && !empty(this.close)) {
      ranges.push(this.open);
      for (const arg of this.args) {
        ranges.push(arg);
      }

      ranges.push(this.close);
    }

    if (!empty(this.on) && !empty(this.expr)) {
      ranges.push(this.on);
      ranges.push(this.expr);
    }

    return ranges;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRun(this);
  }
}

export class RunPath extends Inst {
  constructor(
    public readonly runPath: IToken,
    public readonly open: IToken,
    public readonly expression: IExpr,
    public readonly close: IToken,
    public readonly args?: IExpr[]) {
    super();
  }

  public get start(): Position {
    return this.runPath.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.runPath, this.open, this.expression];
    if (!empty(this.args)) {
      for (const arg of this.args) {
        ranges.push(arg);
      }
    }

    ranges.push(this.close);
    return ranges;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRunPath(this);
  }
}

export class RunPathOnce extends Inst {
  constructor(
    public readonly runPath: IToken,
    public readonly open: IToken,
    public readonly expression: IExpr,
    public readonly close: IToken,
    public readonly args?: IExpr[]) {
    super();
  }

  public get start(): Position {
    return this.runPath.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.runPath, this.open, this.expression];
    if (!empty(this.args)) {
      for (const arg of this.args) {
        ranges.push(arg);
      }
    }

    ranges.push(this.close);
    return ranges;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRunPathOnce(this);
  }
}

export class Compile extends Inst {
  constructor(
    public readonly compile: IToken,
    public readonly expression: IExpr,
    public readonly to?: IToken,
    public readonly target?: IExpr) {
    super();
  }

  public get start(): Position {
    return this.compile.start;
  }

  public get end(): Position {
    return empty(this.target)
      ? this.expression.end
      : this.target.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.compile, this.expression];
    if (!empty(this.to) && !empty(this.target)) {
      ranges.push(this.to);
      ranges.push(this.target);
    }

    return ranges;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCompile(this);
  }
}

export class List extends Inst {
  constructor(
    public readonly list: IToken,
    public readonly identifier?: IToken,
    public readonly inToken?: IToken,
    public readonly target?: IToken) {
    super();
  }

  public get start(): Position {
    return this.list.start;
  }

  public get end(): Position {
    return !empty(this.target)
      ? this.target.end
      : !empty(this.identifier)
        ? this.identifier.end
        : this.list.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.list];

    if (!empty(this.identifier)) {
      ranges.push(this.identifier);

      if (!empty(this.inToken) && !empty(this.target)) {
        ranges.push(this.inToken);
        ranges.push(this.target);
      }
    }

    return ranges;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitList(this);
  }
}

export class Empty extends Inst {
  constructor(public readonly empty: IToken) {
    super();
  }

  public get start(): Position {
    return this.empty.start;
  }

  public get end(): Position {
    return this.empty.end;
  }

  public get ranges(): Range[] {
    return [this.empty];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitEmpty(this);
  }
}

export class Print extends Inst {
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

  public get start(): Position {
    return this.print.start;
  }

  public get end(): Position {
    return empty(this.close)
      ? this.expression.end
      : this.close.end;
  }

  public get ranges(): Range[] {
    const ranges = [this.print, this.expression];

    if (!empty(this.at)
      && !empty(this.open)
      && !empty(this.x)
      && !empty(this.y)
      && !empty(this.close)) {
      ranges.push(this.at);
      ranges.push(this.open);
      ranges.push(this.x);
      ranges.push(this.y);
      ranges.push(this.close);
    }

    return ranges;
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitPrint(this);
  }
}
