import { IInst, IExpr, IInstVisitor, SyntaxKind, IInstPasser } from './types';
import * as Expr from './expr';
import { IToken } from '../entities/types';
import { Range, Position } from 'vscode-languageserver';
import { empty } from '../utilities/typeGuards';
import { NodeBase } from './base';
import { EOL } from 'os';
import { linesJoin } from './toStringUtils';

/**
 * Instruction base class
 */
export abstract class Inst extends NodeBase implements IInst {
  /**
   * Return the tree node type of instruction
   */
  get tag(): SyntaxKind.inst {
    return SyntaxKind.inst;
  }

  /**
   * All instruction implement the pass method
   * Called when the node should be passed through
   * @param visitor visitor object
   */
  public abstract pass<T>(visitor: IInstPasser<T>): T;

  /**
   * All instruction implement the accept method
   * Called whent he node should execute the visitors methods
   * @param visitor visitor object
   */
  public abstract accept<T>(visitor: IInstVisitor<T>): T;
}

export class Invalid extends Inst {
  constructor(public readonly tokens: IToken[]) {
    super();
  }

  public toLines(): string[] {
    return [this.tokens.map(t => t.lexeme).join(' ')];
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passInstInvalid(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitInstInvalid(this);
  }
}

export class Block extends Inst {
  constructor(
    public readonly open: IToken,
    public readonly insts: Inst[],
    public readonly close: IToken) {
    super();
  }

  public toLines(): string[] {
    return [this.open.toString()]
      .concat(
        ...this.insts.map(t =>
          t.toLines().map(line => `    ${line}`)),
        this.close.toString(),
      );
  }

  public get start(): Position {
    return this.open.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    return [this.open, ...this.insts, this.close];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passBlock(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitBlock(this);
  }
}

export class ExprInst extends Inst {
  constructor(
    public readonly suffix: Expr.Suffix) {
    super();
  }

  public toLines(): string[] {
    const suffixLines = this.suffix.toLines();
    suffixLines[suffixLines.length - 1] = `${suffixLines[suffixLines.length - 1]}.`;

    return suffixLines;
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passExpr(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitExpr(this);
  }
}

export class OnOff extends Inst {
  constructor(
    public readonly suffix: Expr.Suffix,
    public readonly onOff: IToken) {
    super();
  }

  public toLines(): string[] {
    const lines = this.suffix.toLines();
    lines[lines.length - 1] = `${lines[lines.length - 1]} ${this.onOff.lexeme}.`;
    return lines;
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passOnOff(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitOnOff(this);
  }
}

export class Command extends Inst {
  constructor(public readonly command: IToken) {
    super();
  }

  public toString(): string {
    throw new Error('Method not implemented.');
  }

  public toLines(): string[] {
    return [`${this.command.lexeme}.`];
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passCommand(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCommand(this);
  }
}

export class CommandExpr extends Inst {
  constructor(
    public readonly command: IToken,
    public readonly expr: IExpr) {
    super();
  }

  public toLines(): string[] {
    const lines = this.expr.toLines();
    lines[0] = `${this.command.lexeme} ${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;

    return lines;
  }

  public get start(): Position {
    return this.command.start;
  }

  public get end(): Position {
    return this.expr.end;
  }

  public get ranges(): Range[] {
    return [this.command, this.expr];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passCommandExpr(this);
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

  public toLines(): string[] {
    return [`${this.unset.lexeme} ${this.identifier.lexeme}.`];
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passUnset(this);
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

  public toLines(): string[] {
    return [`${this.unlock.lexeme} ${this.identifier}.`];
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passUnlock(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitUnlock(this);
  }
}

export class Set extends Inst {
  constructor(
    public readonly set: IToken,
    public readonly suffix: Expr.Suffix,
    public readonly to: IToken,
    public readonly value: IExpr) {
    super();
  }

  public toLines(): string[] {
    const suffixLines = this.suffix.toLines();
    const valueLines = this.value.toLines();

    suffixLines[0] = `${this.set.lexeme} ${suffixLines[0]}`;
    const lines = linesJoin(` ${this.to.lexeme} `, suffixLines, valueLines);
    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
    return lines;
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passSet(this);
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

  public toLines(): string[] {
    return [`${this.atSign.lexeme}${this.lazyGlobal.lexeme} ${this.onOff.lexeme}.`];
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passLazyGlobal(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitLazyGlobal(this);
  }
}

export class If extends Inst {
  constructor(
    public readonly ifToken: IToken,
    public readonly condition: IExpr,
    public readonly ifInst: IInst,
    public readonly elseInst?: Else) {
    super();
  }

  public toLines(): string[] {
    const conditionLines = this.condition.toLines();
    const instLines = this.ifInst.toLines();

    conditionLines[0] = `${this.ifToken.lexeme} ${conditionLines[0]}`;
    const lines = linesJoin(' ', conditionLines, instLines);

    if (!empty(this.elseInst)) {
      const elseLines = this.elseInst.toLines();
      return linesJoin(' ', lines, elseLines);
    }

    return lines;
  }

  public get start(): Position {
    return this.ifToken.start;
  }

  public get end(): Position {
    return empty(this.elseInst)
    ? this.ifInst.end
    : this.elseInst.end;
  }

  public get ranges(): Range[] {
    const ranges = [this.ifToken, this.condition, this.ifInst];
    if (!empty(this.elseInst)) {
      ranges.push(this.elseInst);
    }

    return ranges;
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passIf(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitIf(this);
  }
}

export class Else extends Inst {
  constructor(
    public readonly elseToken: IToken,
    public readonly inst: IInst) {
    super();
  }

  public toLines(): string[] {
    const lines = this.inst.toLines();
    lines[0] = `${this.elseToken.lexeme} ${lines[0]}`;
    return lines;
  }

  public get start(): Position {
    return this.elseToken.start;
  }

  public get end(): Position {
    return this.inst.end;
  }

  public get ranges(): Range[] {
    return [this.elseToken, this.inst];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passElse(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitElse(this);
  }
}

export class Until extends Inst {
  constructor(
    public readonly until: IToken,
    public readonly condition: IExpr,
    public readonly inst: IInst) {
    super();
  }

  public toLines(): string[] {
    const conditionLines = this.condition.toLines();
    const instLines = this.inst.toLines();

    conditionLines[0] = `${this.until.lexeme} ${conditionLines[0]}`;
    return linesJoin(' ', conditionLines, instLines);
  }

  public get start(): Position {
    return this.until.start;
  }

  public get end(): Position {
    return this.inst.end;
  }

  public get ranges(): Range[] {
    return [this.until, this.condition, this.inst];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passUntil(this);
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
    public readonly inst: IInst) {
    super();
  }

  public toLines(): string[] {
    const initializerLines = this.initializer.toLines();
    const conditionLines = this.condition.toLines();
    const incrementLines = this.increment.toLines();
    const instLines = this.inst.toLines();

    initializerLines[0] = `${this.from.lexeme} ${initializerLines[0]}`;
    conditionLines[0] = `${this.until.lexeme} ${conditionLines[0]}`;
    incrementLines[0] = `${this.step.lexeme} ${incrementLines[0]}`;
    instLines[0] = `${this.doToken.lexeme} ${instLines[0]}`;

    return linesJoin(' ', initializerLines, conditionLines, incrementLines, instLines);
  }

  public toString(): string {
    throw new Error('Method not implemented.');
  }

  public get start(): Position {
    return this.from.start;
  }

  public get end(): Position {
    return this.inst.end;
  }

  public get ranges(): Range[] {
    return [
      this.from, this.initializer,
      this.until, this.condition,
      this.step, this.increment,
      this.doToken, this.inst,
    ];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passFrom(this);
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
    public readonly inst: IInst) {
    super();
  }

  public toString(): string {
    throw new Error('Method not implemented.');
  }

  public toLines(): string[] {
    const conditionLines = this.condition.toLines();
    const instLines = this.inst.toLines();

    conditionLines[0] = `${this.when.lexeme} ${conditionLines[0]}`;
    instLines[0] = `${this.then.lexeme} ${instLines[0]}`;

    return linesJoin(' ', conditionLines, instLines);
  }

  public get start(): Position {
    return this.when.start;
  }

  public get end(): Position {
    return this.inst.end;
  }

  public get ranges(): Range[] {
    return [
      this.when, this.condition,
      this.then, this.inst,
    ];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passWhen(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitWhen(this);
  }
}

export class Return extends Inst {
  constructor(
    public readonly returnToken: IToken,
    public readonly expr?: IExpr) {
    super();
  }

  public toString(): string {
    throw new Error('Method not implemented.');
  }

  public toLines(): string[] {
    if (!empty(this.expr)) {
      const exprLines = this.expr.toLines();

      exprLines[0] = `${this.returnToken.lexeme} ${exprLines[0]}`;
      exprLines[exprLines.length - 1] = `${exprLines[exprLines.length - 1]}.`;
      return exprLines;
    }

    return [`${this.returnToken.lexeme}.`];
  }

  public get start(): Position {
    return this.returnToken.start;
  }

  public get end(): Position {
    return empty(this.expr)
      ? this.returnToken.end
      : this.expr.end;
  }

  public get ranges(): Range[] {
    let ranges: Range[] = [this.returnToken];
    if (!empty(this.expr)) {
      ranges = ranges.concat(this.expr.ranges);
    }

    return ranges;
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passReturn(this);
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

  public toString(): string {
    throw new Error('Method not implemented.');
  }

  public toLines(): string[] {
    return [`${this.breakToken.lexeme}.`];
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passBreak(this);
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

  public toLines(): string[] {
    const targetLines = this.target.toLines();

    targetLines[0] = `${this.switchToken.lexeme} ${this.to.lexeme} ${targetLines[0]}`;
    targetLines[targetLines.length - 1] = `${targetLines[targetLines.length - 1]}.`;

    return targetLines;
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passSwitch(this);
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
    public readonly suffix: Expr.Suffix,
    public readonly inst: IInst) {
    super();
  }

  public toLines(): string[] {
    const suffixLines = this.suffix.toLines();
    const instLines = this.inst.toLines();

    suffixLines[0] = `${this.forToken.lexeme} ${this.identifier.lexeme} `
      + `${this.inToken.lexeme} ${suffixLines[0]}`;

    return linesJoin(' ', suffixLines, instLines);
  }

  public get start(): Position {
    return this.forToken.start;
  }

  public get end(): Position {
    return this.inst.end;
  }

  public get ranges(): Range[] {
    return [
      this.forToken, this.identifier,
      this.inToken, this.suffix,
      this.inst,
    ];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passFor(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitFor(this);
  }
}

export class On extends Inst {
  constructor(
    public readonly on: IToken,
    public readonly suffix: Expr.Suffix,
    public readonly inst: IInst) {
    super();
  }

  public toLines(): string[] {
    const suffixLines = this.suffix.toLines();
    const instLInes = this.inst.toLines();

    suffixLines[0] = `${this.on.lexeme} ${suffixLines[0]}`;
    return linesJoin(' ', suffixLines, instLInes);
  }

  public get start(): Position {
    return this.on.start;
  }

  public get end(): Position {
    return this.inst.end;
  }

  public get ranges(): Range[] {
    return [this.on, this.suffix, this.inst];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passOn(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitOn(this);
  }
}

export class Toggle extends Inst {
  constructor(
    public readonly toggle: IToken,
    public readonly suffix: Expr.Suffix) {
    super();
  }

  public toLines(): string[] {
    const suffixLines = this.suffix.toLines();
    suffixLines[0] = `${this.toggle.lexeme} ${suffixLines[0]}`;

    return suffixLines;
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passToggle(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitToggle(this);
  }
}

export class Wait extends Inst {
  constructor(
    public readonly wait: IToken,
    public readonly expr: IExpr,
    public readonly until?: IToken) {
    super();
  }

  public toLines(): string[] {
    const exprLines = this.expr.toLines();
    if (!empty(this.until)) {
      exprLines[0] = `${this.wait.lexeme} ${this.until.lexeme} ${exprLines[0]}`;
      return exprLines;
    }

    exprLines[0] = `${this.wait.lexeme} ${exprLines[0]}`;
    return exprLines;
  }

  public get start(): Position {
    return this.wait.start;
  }

  public get end(): Position {
    return this.expr.end;
  }

  public get ranges(): Range[] {
    if (empty(this.until)) {
      return [this.wait, this.expr];
    }

    return [this.wait, this.until, this.expr];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passWait(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitWait(this);
  }
}

export class Log extends Inst {
  constructor(
    public readonly log: IToken,
    public readonly expr: IExpr,
    public readonly to: IToken,
    public readonly target: IExpr) {
    super();
  }

  public toString(): string {
    throw new Error('Method not implemented.');
  }

  public toLines(): string[] {
    const exprLines = this.expr.toLines();
    const targetLines = this.target.toLines();

    exprLines[0] = `${this.log.lexeme} ${exprLines[0]}`;
    targetLines[0] = `${this.to.lexeme} ${targetLines[0]}`;

    return linesJoin(' ', exprLines, targetLines);
  }

  public get start(): Position {
    return this.log.start;
  }

  public get end(): Position {
    return this.target.end;
  }

  public get ranges(): Range[] {
    return [this.log, this.expr, this.to, this.target];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passLog(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitLog(this);
  }
}

export class Copy extends Inst {
  constructor(
    public readonly copy: IToken,
    public readonly target: IExpr,
    public readonly toFrom: IToken,
    public readonly destination: IExpr) {
    super();
  }

  public toLines(): string[] {
    const targetLines = this.target.toLines();
    const destinationLines = this.target.toLines();

    targetLines[0] = `${this.copy.lexeme} ${targetLines[0]}`;
    destinationLines[0] = `${this.toFrom.lexeme} ${destinationLines[0]}`;

    return linesJoin(' ', targetLines, destinationLines);
  }

  public get start(): Position {
    return this.copy.start;
  }

  public get end(): Position {
    return this.destination.end;
  }

  public get ranges(): Range[] {
    return [this.copy, this.target, this.toFrom, this.destination];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passCopy(this);
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
    public readonly target: IExpr,
    public readonly to: IToken,
    public readonly alternative: IExpr) {
    super();
  }

  public toLines(): string[] {
    const targetLines = this.target.toLines();
    const alternativeLines = this.alternative.toLines();

    targetLines[0] = `${this.rename.lexeme} ${this.fileVolume.lexeme}`
      + `${this.ioIdentifer.lexeme} ${targetLines[0]}`;
    alternativeLines[0] = `${this.to.lexeme} ${alternativeLines[0]}`;

    return linesJoin(' ', targetLines, alternativeLines);
  }

  public get start(): Position {
    return this.rename.start;
  }

  public get end(): Position {
    return this.alternative.end;
  }

  public get ranges(): Range[] {
    return [
      this.rename, this.ioIdentifer,
      this.target, this.to,
      this.alternative,
    ];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passRename(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRename(this);
  }
}

export class Delete extends Inst {
  constructor(
    public readonly deleteToken: IToken,
    public readonly target: IExpr,
    public readonly from?: IToken,
    public readonly volume?: IExpr) {
    super();
  }

  public toLines(): string[] {
    const targetLines = this.target.toLines();
    targetLines[0] = `${this.deleteToken.lexeme} ${targetLines[0]}`;

    if (!empty(this.from) && !empty(this.volume)) {
      const volumeLines = this.volume.toLines();
      volumeLines[0] = `${this.from.lexeme} ${volumeLines[0]}`;

      return linesJoin(' ', targetLines, volumeLines);
    }

    return targetLines;
  }

  public get start(): Position {
    return this.deleteToken.start;
  }

  public get end(): Position {
    return empty(this.volume)
      ? this.target.end
      : this.volume.end;
  }

  public get ranges(): Range[] {
    const ranges = [this.deleteToken, this.target];
    if (!empty(this.from) && !empty(this.volume)) {
      ranges.push(this.from);
      ranges.push(this.volume);
    }

    return ranges;
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passDelete(this);
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

  public toString(): string {
    throw new Error('Method not implemented.');
  }

  public toLines(): string[] {
    let lines = empty(this.once)
      ? [`${this.run.lexeme} ${this.identifier.lexeme}`]
      : [`${this.run.lexeme} ${this.once.lexeme} ${this.identifier.lexeme}`];

    if (!empty(this.open) && !empty(this.args) && !empty(this.close)) {
      const argsLines = linesJoin(', ', ...this.args.map(arg => arg.toLines()));
      argsLines[0] = `${this.open.lexeme}${argsLines[0]}`;
      argsLines[argsLines.length - 1] = `${argsLines[argsLines.length - 1]}${this.close.lexeme}`;

      lines = linesJoin(' ', lines, argsLines);
    }

    if (!empty(this.on) && !empty(this.expr)) {
      const exprLines = this.expr.toLines();
      exprLines[0] = `${this.on.lexeme} ${exprLines[0]}`;

      lines = linesJoin(' ', lines, exprLines);
    }

    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
    return lines;
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passRun(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRun(this);
  }
}

export class RunPath extends Inst {
  constructor(
    public readonly runPath: IToken,
    public readonly open: IToken,
    public readonly expr: IExpr,
    public readonly close: IToken,
    public readonly args?: IExpr[]) {
    super();
  }

  public toLines(): string[] {
    let lines = this.expr.toLines();

    if (!empty(this.args)) {
      lines = linesJoin(', ', ...this.args.map(arg => arg.toLines()));
    }

    lines[0] = `${this.runPath.lexeme}${this.open.lexeme}${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}${this.close.lexeme}.`;
    return lines;
  }

  public get start(): Position {
    return this.runPath.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.runPath, this.open, this.expr];
    if (!empty(this.args)) {
      for (const arg of this.args) {
        ranges.push(arg);
      }
    }

    ranges.push(this.close);
    return ranges;
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passRunPath(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRunPath(this);
  }
}

export class RunPathOnce extends Inst {
  constructor(
    public readonly runPath: IToken,
    public readonly open: IToken,
    public readonly expr: IExpr,
    public readonly close: IToken,
    public readonly args?: IExpr[]) {
    super();
  }

  public toLines(): string[] {
    let lines = this.expr.toLines();

    if (!empty(this.args)) {
      lines = linesJoin(', ', ...this.args.map(arg => arg.toLines()));
    }

    lines[0] = `${this.runPath.lexeme}${this.open.lexeme}${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}${this.close.lexeme}.`;
    return lines;
  }

  public get start(): Position {
    return this.runPath.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.runPath, this.open, this.expr];
    if (!empty(this.args)) {
      for (const arg of this.args) {
        ranges.push(arg);
      }
    }

    ranges.push(this.close);
    return ranges;
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passRunPathOnce(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitRunPathOnce(this);
  }
}

export class Compile extends Inst {
  constructor(
    public readonly compile: IToken,
    public readonly target: IExpr,
    public readonly to?: IToken,
    public readonly destination?: IExpr) {
    super();
  }

  public toLines(): string[] {
    let lines = this.target.toLines();

    if (!empty(this.destination) && !empty(this.to)) {
      lines = linesJoin(` ${this.to.lexeme} `, this.destination.toLines());
    }

    lines[0] = `${this.compile.lexeme} ${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
    return lines;
  }

  public get start(): Position {
    return this.compile.start;
  }

  public get end(): Position {
    return empty(this.destination)
      ? this.target.end
      : this.destination.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.compile, this.target];
    if (!empty(this.to) && !empty(this.destination)) {
      ranges.push(this.to);
      ranges.push(this.destination);
    }

    return ranges;
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passCompile(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitCompile(this);
  }
}

export class List extends Inst {
  constructor(
    public readonly list: IToken,
    public readonly collection?: IToken,
    public readonly inToken?: IToken,
    public readonly target?: IToken) {
    super();
  }

  public toLines(): string[] {
    if (!empty(this.collection) && !empty(this.inToken) && !empty(this.target)) {
      return [`${this.list.lexeme} ${this.collection.lexeme} `
        + `${this.inToken.lexeme} ${this.target.lexeme}.`];
    }

    if (!empty(this.collection)) {
      return [`${this.list.lexeme} ${this.collection.lexeme}.`];
    }

    return [`${this.list.lexeme}.`];
  }

  public get start(): Position {
    return this.list.start;
  }

  public get end(): Position {
    return !empty(this.target)
      ? this.target.end
      : !empty(this.collection)
        ? this.collection.end
        : this.list.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.list];

    if (!empty(this.collection)) {
      ranges.push(this.collection);

      if (!empty(this.inToken) && !empty(this.target)) {
        ranges.push(this.inToken);
        ranges.push(this.target);
      }
    }

    return ranges;
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passList(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitList(this);
  }
}

export class Empty extends Inst {
  constructor(public readonly empty: IToken) {
    super();
  }

  public toLines(): string[] {
    return ['.'];
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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passEmpty(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitEmpty(this);
  }
}

export class Print extends Inst {
  constructor(
    public readonly print: IToken,
    public readonly expr: IExpr,
    public readonly at?: IToken,
    public readonly open?: IToken,
    public readonly x?: IExpr,
    public readonly y?: IExpr,
    public readonly close?: IToken) {
    super();
  }

  public toLines(): string[] {
    let lines = this.expr.toLines();
    lines[0] = `${this.print.lexeme} ${lines[0]}`;

    if (!empty(this.at) && !empty(this.open)
      && !empty(this.x) && !empty(this.y)
      && !empty(this.close)) {
      const xLines = this.x.toLines();
      const yLines = this.y.toLines();

      xLines[0] = `${this.at.lexeme} ${this.open.lexeme}${xLines[0]}`;
      yLines[yLines.length - 1] = `${yLines[yLines.length - 1]}${this.close.lexeme}`;

      const argLines = linesJoin(', ', xLines, yLines);
      lines = linesJoin(' ', lines, argLines);
    }

    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
    return lines;
  }

  public get start(): Position {
    return this.print.start;
  }

  public get end(): Position {
    return empty(this.close)
      ? this.expr.end
      : this.close.end;
  }

  public get ranges(): Range[] {
    const ranges = [this.print, this.expr];

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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passPrint(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitPrint(this);
  }
}
