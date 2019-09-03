import {
  IStmt,
  IExpr,
  IStmtVisitor,
  SyntaxKind,
  NodeDataBuilder,
  PartialNode,
} from './types';
import * as Expr from './expr';
import { Range, Position } from 'vscode-languageserver';
import { empty, unWrap, notEmpty } from '../utilities/typeGuards';
import { NodeBase } from './base';
import { joinLines } from './toStringUtils';
import { flatten } from '../utilities/arrayUtils';
import { rangeOrder, rangeContains } from '../utilities/positionUtils';
import { Token } from '../entities/token';

/**
 * Statement base class
 */
export abstract class Stmt extends NodeBase implements IStmt {
  /**
   * Return the tree node type of statement
   */
  get tag(): SyntaxKind.stmt {
    return SyntaxKind.stmt;
  }

  /**
   * All statement implement the accept method
   * Called when he node should execute the visitors methods
   * @param visitor visitor object
   */
  public abstract accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T>;
}

/**
 * Represents a malformed statement in kerboscript
 */
export class Invalid extends Stmt {
  /**
   * Construct a new invalid statement
   * @param pos Provides the start position of this statement
   * @param tokens tokens involved in this invalid statement
   * @param partial any partial node that was recovered
   */
  constructor(
    public readonly pos: Position,
    public readonly tokens: Token[],
    public readonly partial?: PartialNode,
  ) {
    super();
  }

  /**
   * Convert this invalid statement into a set of line
   */
  public toLines(): string[] {
    return [this.tokens.map(t => t.lexeme).join(' ')];
  }

  /**
   * What is the start position of this statement
   */
  public get start(): Position {
    return this.tokens.length > 0 ? this.tokens[0].start : this.pos;
  }

  /**
   * What is the end position of this statement
   */
  public get end(): Position {
    return this.tokens.length > 0
      ? this.tokens[this.tokens.length - 1].end
      : this.pos;
  }

  /**
   * What are the ranges of this statement
   */
  public get ranges(): Range[] {
    if (empty(this.partial)) {
      return this.tokens;
    }

    // order each piece of the partial by it's range
    let segments = Object.values(this.partial)
      .filter(notEmpty)
      .sort(rangeOrder);

    // attempt to add tokens to segments
    for (const token of this.tokens) {
      let overlap = false;

      // check for overlap
      for (const segment of segments) {
        if (rangeContains(segment, token)) {
          overlap = true;
          break;
        }
      }

      // if no overall add to segments
      if (!overlap) {
        segments.push(token);
      }
    }

    // reorder segments
    segments = segments.sort(rangeOrder);
    return segments;
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitStmtInvalid(this, parameters);
  }
}

export class Block extends Stmt {
  public readonly open: Token;
  public readonly stmts: Stmt[];
  public readonly close: Token;

  constructor(builder: NodeDataBuilder<Block>) {
    super();

    this.open = unWrap(builder.open);
    this.stmts = unWrap(builder.stmts);
    this.close = unWrap(builder.close);
  }

  public toLines(): string[] {
    const lines = flatten(this.stmts.map(stmt => stmt.toLines()));

    if (lines.length === 0) {
      return [`${this.open.lexeme} ${this.close.lexeme}`];
    }

    if (lines.length === 1) {
      return [`${this.open.lexeme} ${lines[0]} ${this.close.lexeme}`];
    }

    return [`${this.open.lexeme}`].concat(
      ...lines.map(line => `    ${line}`),
      `${this.close.lexeme}`,
    );
  }

  public get start(): Position {
    return this.open.start;
  }

  public get end(): Position {
    return this.close.end;
  }

  public get ranges(): Range[] {
    return [this.open, ...this.stmts, this.close];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitBlock(this, parameters);
  }
}

export class ExprStmt extends Stmt {
  constructor(public readonly suffix: Expr.Suffix) {
    super();
  }

  public toLines(): string[] {
    const suffixLines = this.suffix.toLines();
    suffixLines[suffixLines.length - 1] = `${
      suffixLines[suffixLines.length - 1]
    }.`;

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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitExpr(this, parameters);
  }
}

export class OnOff extends Stmt {
  public readonly suffix: Expr.Suffix;
  public readonly onOff: Token;

  constructor(builder: NodeDataBuilder<OnOff>) {
    super();

    this.suffix = unWrap(builder.suffix);
    this.onOff = unWrap(builder.onOff);
  }

  public toLines(): string[] {
    const lines = this.suffix.toLines();
    lines[lines.length - 1] = `${lines[lines.length - 1]} ${
      this.onOff.lexeme
    }.`;
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitOnOff(this, parameters);
  }
}
export class Command extends Stmt {
  constructor(public readonly command: Token) {
    super();
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitCommand(this, parameters);
  }
}
export class CommandExpr extends Stmt {
  public readonly command: Token;
  public readonly expr: IExpr;

  constructor(builder: NodeDataBuilder<CommandExpr>) {
    super();

    this.command = unWrap(builder.command);
    this.expr = unWrap(builder.expr);
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitCommandExpr(this, parameters);
  }
}

export class Unset extends Stmt {
  public readonly unset: Token;
  public readonly identifier: Token;

  constructor(builder: NodeDataBuilder<Unset>) {
    super();

    this.unset = unWrap(builder.unset);
    this.identifier = unWrap(builder.identifier);
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitUnset(this, parameters);
  }
}

export class Unlock extends Stmt {
  public readonly unlock: Token;
  public readonly identifier: Token;

  constructor(builder: NodeDataBuilder<Unlock>) {
    super();

    this.unlock = unWrap(builder.unlock);
    this.identifier = unWrap(builder.identifier);
  }

  public toLines(): string[] {
    return [`${this.unlock.lexeme} ${this.identifier.lexeme}.`];
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitUnlock(this, parameters);
  }
}

export class Set extends Stmt {
  public readonly set: Token;
  public readonly suffix: Expr.Suffix;
  public readonly to: Token;
  public readonly value: IExpr;

  constructor(builder: NodeDataBuilder<Set>) {
    super();
    this.set = unWrap(builder.set);
    this.suffix = unWrap(builder.suffix);
    this.to = unWrap(builder.to);
    this.value = unWrap(builder.value);
  }

  public toLines(): string[] {
    const suffixLines = this.suffix.toLines();
    const valueLines = this.value.toLines();

    suffixLines[0] = `${this.set.lexeme} ${suffixLines[0]}`;
    const lines = joinLines(` ${this.to.lexeme} `, suffixLines, valueLines);
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitSet(this, parameters);
  }
}

export class LazyGlobal extends Stmt {
  public readonly atSign: Token;
  public readonly lazyGlobal: Token;
  public readonly onOff: Token;

  constructor(builder: NodeDataBuilder<LazyGlobal>) {
    super();

    this.atSign = unWrap(builder.atSign);
    this.lazyGlobal = unWrap(builder.lazyGlobal);
    this.onOff = unWrap(builder.onOff);
  }

  public toLines(): string[] {
    return [
      `${this.atSign.lexeme}${this.lazyGlobal.lexeme} ${this.onOff.lexeme}.`,
    ];
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitLazyGlobal(this, parameters);
  }
}

export class If extends Stmt {
  public readonly ifToken: Token;
  public readonly condition: IExpr;
  public readonly body: IStmt;
  public readonly elseStmt?: Else;

  constructor(builder: NodeDataBuilder<If>) {
    super();
    this.ifToken = unWrap(builder.ifToken);
    this.condition = unWrap(builder.condition);
    this.body = unWrap(builder.body);
    this.elseStmt = builder.elseStmt;
  }

  public toLines(): string[] {
    const conditionLines = this.condition.toLines();
    const stmtLines = this.body.toLines();

    conditionLines[0] = `${this.ifToken.lexeme} ${conditionLines[0]}`;
    const lines = joinLines(' ', conditionLines, stmtLines);

    if (!empty(this.elseStmt)) {
      const elseLines = this.elseStmt.toLines();
      return joinLines(' ', lines, elseLines);
    }

    return lines;
  }

  public get start(): Position {
    return this.ifToken.start;
  }

  public get end(): Position {
    return empty(this.elseStmt) ? this.body.end : this.elseStmt.end;
  }

  public get ranges(): Range[] {
    const ranges = [this.ifToken, this.condition, this.body];
    if (!empty(this.elseStmt)) {
      ranges.push(this.elseStmt);
    }

    return ranges;
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitIf(this, parameters);
  }
}

export class Else extends Stmt {
  public readonly elseToken: Token;
  public readonly body: IStmt;

  constructor(builder: NodeDataBuilder<Else>) {
    super();

    this.elseToken = unWrap(builder.elseToken);
    this.body = unWrap(builder.body);
  }

  public toLines(): string[] {
    const lines = this.body.toLines();
    lines[0] = `${this.elseToken.lexeme} ${lines[0]}`;
    return lines;
  }

  public get start(): Position {
    return this.elseToken.start;
  }

  public get end(): Position {
    return this.body.end;
  }

  public get ranges(): Range[] {
    return [this.elseToken, this.body];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitElse(this, parameters);
  }
}

export class Until extends Stmt {
  public readonly until: Token;
  public readonly condition: IExpr;
  public readonly body: IStmt;

  constructor(builder: NodeDataBuilder<Until>) {
    super();

    this.until = unWrap(builder.until);
    this.condition = unWrap(builder.condition);
    this.body = unWrap(builder.body);
  }

  public toLines(): string[] {
    const conditionLines = this.condition.toLines();
    const bodyLines = this.body.toLines();

    conditionLines[0] = `${this.until.lexeme} ${conditionLines[0]}`;
    return joinLines(' ', conditionLines, bodyLines);
  }

  public get start(): Position {
    return this.until.start;
  }

  public get end(): Position {
    return this.body.end;
  }

  public get ranges(): Range[] {
    return [this.until, this.condition, this.body];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitUntil(this, parameters);
  }
}

export class From extends Stmt {
  public readonly from: Token;
  public readonly initializer: Block;
  public readonly until: Token;
  public readonly condition: IExpr;
  public readonly step: Token;
  public readonly increment: Block;
  public readonly doToken: Token;
  public readonly body: IStmt;
  constructor(builder: NodeDataBuilder<From>) {
    super();

    this.from = unWrap(builder.from);
    this.initializer = unWrap(builder.initializer);
    this.until = unWrap(builder.until);
    this.condition = unWrap(builder.condition);
    this.step = unWrap(builder.step);
    this.increment = unWrap(builder.increment);
    this.doToken = unWrap(builder.doToken);
    this.body = unWrap(builder.body);
  }

  public toLines(): string[] {
    const initializerLines = this.initializer.toLines();
    const conditionLines = this.condition.toLines();
    const incrementLines = this.increment.toLines();
    const bodyLines = this.body.toLines();

    initializerLines[0] = `${this.from.lexeme} ${initializerLines[0]}`;
    conditionLines[0] = `${this.until.lexeme} ${conditionLines[0]}`;
    incrementLines[0] = `${this.step.lexeme} ${incrementLines[0]}`;
    bodyLines[0] = `${this.doToken.lexeme} ${bodyLines[0]}`;

    return joinLines(
      ' ',
      initializerLines,
      conditionLines,
      incrementLines,
      bodyLines,
    );
  }

  public get start(): Position {
    return this.from.start;
  }

  public get end(): Position {
    return this.body.end;
  }

  public get ranges(): Range[] {
    return [
      this.from,
      this.initializer,
      this.until,
      this.condition,
      this.step,
      this.increment,
      this.doToken,
      this.body,
    ];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitFrom(this, parameters);
  }
}

export class When extends Stmt {
  public readonly when: Token;
  public readonly condition: IExpr;
  public readonly then: Token;
  public readonly body: IStmt;

  constructor(builder: NodeDataBuilder<When>) {
    super();
    this.when = unWrap(builder.when);
    this.condition = unWrap(builder.condition);
    this.then = unWrap(builder.then);
    this.body = unWrap(builder.body);
  }

  public toLines(): string[] {
    const conditionLines = this.condition.toLines();
    const bodyLines = this.body.toLines();

    conditionLines[0] = `${this.when.lexeme} ${conditionLines[0]}`;
    bodyLines[0] = `${this.then.lexeme} ${bodyLines[0]}`;

    return joinLines(' ', conditionLines, bodyLines);
  }

  public get start(): Position {
    return this.when.start;
  }

  public get end(): Position {
    return this.body.end;
  }

  public get ranges(): Range[] {
    return [this.when, this.condition, this.then, this.body];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitWhen(this, parameters);
  }
}

export class Return extends Stmt {
  public readonly returnToken: Token;
  public readonly value?: IExpr;

  constructor(builder: NodeDataBuilder<Return>) {
    super();

    this.returnToken = unWrap(builder.returnToken);
    this.value = builder.value;
  }

  public toLines(): string[] {
    if (!empty(this.value)) {
      const exprLines = this.value.toLines();

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
    return empty(this.value) ? this.returnToken.end : this.value.end;
  }

  public get ranges(): Range[] {
    let ranges: Range[] = [this.returnToken];
    if (!empty(this.value)) {
      ranges = ranges.concat(this.value.ranges);
    }

    return ranges;
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitReturn(this, parameters);
  }
}

export class Break extends Stmt {
  constructor(public readonly breakToken: Token) {
    super();
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitBreak(this, parameters);
  }
}

export class Switch extends Stmt {
  public readonly switchToken: Token;
  public readonly to: Token;
  public readonly target: IExpr;

  constructor(builder: NodeDataBuilder<Switch>) {
    super();

    this.switchToken = unWrap(builder.switchToken);
    this.to = unWrap(builder.to);
    this.target = unWrap(builder.target);
  }

  public toLines(): string[] {
    const targetLines = this.target.toLines();

    targetLines[0] = `${this.switchToken.lexeme} ${this.to.lexeme} ${targetLines[0]}`;
    targetLines[targetLines.length - 1] = `${
      targetLines[targetLines.length - 1]
    }.`;

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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitSwitch(this, parameters);
  }
}

export class For extends Stmt {
  public readonly forToken: Token;
  public readonly element: Token;
  public readonly inToken: Token;
  public readonly collection: Expr.Suffix;
  public readonly body: IStmt;

  constructor(builder: NodeDataBuilder<For>) {
    super();
    this.forToken = unWrap(builder.forToken);
    this.element = unWrap(builder.element);
    this.inToken = unWrap(builder.inToken);
    this.collection = unWrap(builder.collection);
    this.body = unWrap(builder.body);
  }

  public toLines(): string[] {
    const suffixLines = this.collection.toLines();
    const bodyLines = this.body.toLines();

    suffixLines[0] =
      `${this.forToken.lexeme} ${this.element.lexeme} ` +
      `${this.inToken.lexeme} ${suffixLines[0]}`;

    return joinLines(' ', suffixLines, bodyLines);
  }

  public get start(): Position {
    return this.forToken.start;
  }

  public get end(): Position {
    return this.body.end;
  }

  public get ranges(): Range[] {
    return [
      this.forToken,
      this.element,
      this.inToken,
      this.collection,
      this.body,
    ];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitFor(this, parameters);
  }
}

export class On extends Stmt {
  public readonly on: Token;
  public readonly suffix: Expr.Suffix;
  public readonly body: IStmt;

  constructor(builder: NodeDataBuilder<On>) {
    super();

    this.on = unWrap(builder.on);
    this.suffix = unWrap(builder.suffix);
    this.body = unWrap(builder.body);
  }

  public toLines(): string[] {
    const suffixLines = this.suffix.toLines();
    const bodyLines = this.body.toLines();

    suffixLines[0] = `${this.on.lexeme} ${suffixLines[0]}`;
    return joinLines(' ', suffixLines, bodyLines);
  }

  public get start(): Position {
    return this.on.start;
  }

  public get end(): Position {
    return this.body.end;
  }

  public get ranges(): Range[] {
    return [this.on, this.suffix, this.body];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitOn(this, parameters);
  }
}

export class Toggle extends Stmt {
  public readonly toggle: Token;
  public readonly suffix: Expr.Suffix;

  constructor(builder: NodeDataBuilder<Toggle>) {
    super();

    this.toggle = unWrap(builder.toggle);
    this.suffix = unWrap(builder.suffix);
  }

  public toLines(): string[] {
    const suffixLines = this.suffix.toLines();
    suffixLines[0] = `${this.toggle.lexeme} ${suffixLines[0]}`;
    suffixLines[suffixLines.length - 1] = `${
      suffixLines[suffixLines.length - 1]
    }.`;

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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitToggle(this, parameters);
  }
}

export class Wait extends Stmt {
  public readonly wait: Token;
  public readonly until?: Token;
  public readonly expr: IExpr;

  constructor(builder: NodeDataBuilder<Wait>) {
    super();

    this.wait = unWrap(builder.wait);
    this.until = builder.until;
    this.expr = unWrap(builder.expr);
  }

  public toLines(): string[] {
    const exprLines = this.expr.toLines();
    exprLines[0] = empty(this.until)
      ? `${this.wait.lexeme} ${exprLines[0]}`
      : `${this.wait.lexeme} ${this.until.lexeme} ${exprLines[0]}`;

    exprLines[exprLines.length - 1] = `${exprLines[exprLines.length - 1]}.`;
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitWait(this, parameters);
  }
}

export class Log extends Stmt {
  public readonly log: Token;
  public readonly expr: IExpr;
  public readonly to: Token;
  public readonly target: IExpr;

  constructor(builder: NodeDataBuilder<Log>) {
    super();

    this.log = unWrap(builder.log);
    this.expr = unWrap(builder.expr);
    this.to = unWrap(builder.to);
    this.target = unWrap(builder.target);
  }

  public toLines(): string[] {
    const exprLines = this.expr.toLines();
    const targetLines = this.target.toLines();

    exprLines[0] = `${this.log.lexeme} ${exprLines[0]}`;
    targetLines[0] = `${this.to.lexeme} ${targetLines[0]}`;
    targetLines[targetLines.length - 1] = `${
      targetLines[targetLines.length - 1]
    }.`;

    return joinLines(' ', exprLines, targetLines);
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitLog(this, parameters);
  }
}

export class Copy extends Stmt {
  public readonly copy: Token;
  public readonly target: IExpr;
  public readonly toFrom: Token;
  public readonly destination: IExpr;

  constructor(builder: NodeDataBuilder<Copy>) {
    super();

    this.copy = unWrap(builder.copy);
    this.target = unWrap(builder.target);
    this.toFrom = unWrap(builder.toFrom);
    this.destination = unWrap(builder.destination);
  }

  public toLines(): string[] {
    const targetLines = this.target.toLines();
    const destinationLines = this.destination.toLines();

    targetLines[0] = `${this.copy.lexeme} ${targetLines[0]}`;
    destinationLines[0] = `${this.toFrom.lexeme} ${destinationLines[0]}.`;

    return joinLines(' ', targetLines, destinationLines);
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitCopy(this, parameters);
  }
}

export class Rename extends Stmt {
  public readonly rename: Token;
  public readonly fileVolume: Token;
  public readonly identifier: Token;
  public readonly target: IExpr;
  public readonly to: Token;
  public readonly alternative: IExpr;

  constructor(builder: NodeDataBuilder<Rename>) {
    super();

    this.rename = unWrap(builder.rename);
    this.fileVolume = unWrap(builder.fileVolume);
    this.identifier = unWrap(builder.identifier);
    this.target = unWrap(builder.target);
    this.to = unWrap(builder.to);
    this.alternative = unWrap(builder.alternative);
  }

  public toLines(): string[] {
    const targetLines = this.target.toLines();
    const alternativeLines = this.alternative.toLines();

    targetLines[0] =
      `${this.rename.lexeme} ${this.fileVolume.lexeme} ` +
      `${this.identifier.lexeme} ${targetLines[0]}`;
    alternativeLines[0] = `${this.to.lexeme} ${alternativeLines[0]}.`;

    return joinLines(' ', targetLines, alternativeLines);
  }

  public get start(): Position {
    return this.rename.start;
  }

  public get end(): Position {
    return this.alternative.end;
  }

  public get ranges(): Range[] {
    return [
      this.rename,
      this.identifier,
      this.target,
      this.to,
      this.alternative,
    ];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitRename(this, parameters);
  }
}

export class Delete extends Stmt {
  public readonly deleteToken: Token;
  public readonly target: IExpr;
  public readonly from?: Token;
  public readonly volume?: IExpr;

  constructor(builder: NodeDataBuilder<Delete>) {
    super();

    this.deleteToken = unWrap(builder.deleteToken);
    this.target = unWrap(builder.target);
    this.from = builder.from;
    this.volume = builder.volume;
  }

  public toLines(): string[] {
    const targetLines = this.target.toLines();
    targetLines[0] = `${this.deleteToken.lexeme} ${targetLines[0]}`;

    if (!empty(this.from) && !empty(this.volume)) {
      const volumeLines = this.volume.toLines();
      volumeLines[0] = `${this.from.lexeme} ${volumeLines[0]}`;
      volumeLines[volumeLines.length - 1] = `${
        volumeLines[volumeLines.length - 1]
      }.`;

      return joinLines(' ', targetLines, volumeLines);
    }

    targetLines[targetLines.length - 1] = `${
      targetLines[targetLines.length - 1]
    }.`;
    return targetLines;
  }

  public get start(): Position {
    return this.deleteToken.start;
  }

  public get end(): Position {
    return empty(this.volume) ? this.target.end : this.volume.end;
  }

  public get ranges(): Range[] {
    const ranges = [this.deleteToken, this.target];
    if (!empty(this.from) && !empty(this.volume)) {
      ranges.push(this.from);
      ranges.push(this.volume);
    }

    return ranges;
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitDelete(this, parameters);
  }
}

export class Run extends Stmt {
  public readonly run: Token;
  public readonly identifier: Token;
  public readonly once?: Token;
  public readonly open?: Token;
  public readonly args?: IExpr[];
  public readonly close?: Token;
  public readonly on?: Token;
  public readonly expr?: IExpr;

  constructor(builder: NodeDataBuilder<Run>) {
    super();

    this.run = unWrap(builder.run);
    this.identifier = unWrap(builder.identifier);
    this.once = builder.once;
    this.open = builder.open;
    this.args = builder.args;
    this.close = builder.close;
    this.on = builder.on;
    this.expr = builder.expr;
  }

  public toLines(): string[] {
    let lines = empty(this.once)
      ? [`${this.run.lexeme} ${this.identifier.lexeme}`]
      : [`${this.run.lexeme} ${this.once.lexeme} ${this.identifier.lexeme}`];

    if (!empty(this.open) && !empty(this.args) && !empty(this.close)) {
      const argsLines = joinLines(', ', ...this.args.map(arg => arg.toLines()));
      argsLines[0] = `${this.open.lexeme}${argsLines[0]}`;
      argsLines[argsLines.length - 1] = `${argsLines[argsLines.length - 1]}${
        this.close.lexeme
      }`;

      lines = joinLines(' ', lines, argsLines);
    }

    if (!empty(this.on) && !empty(this.expr)) {
      const exprLines = this.expr.toLines();
      exprLines[0] = `${this.on.lexeme} ${exprLines[0]}`;

      lines = joinLines(' ', lines, exprLines);
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitRun(this, parameters);
  }
}

export class RunPath extends Stmt {
  public readonly runPath: Token;
  public readonly open: Token;
  public readonly expr: IExpr;
  public readonly close: Token;
  public readonly args?: IExpr[];

  constructor(builder: NodeDataBuilder<RunPath>) {
    super();

    this.runPath = unWrap(builder.runPath);
    this.open = unWrap(builder.open);
    this.expr = unWrap(builder.expr);
    this.close = unWrap(builder.close);
    this.args = builder.args;
  }

  public toLines(): string[] {
    let lines = this.expr.toLines();

    if (!empty(this.args)) {
      lines = joinLines(', ', lines, ...this.args.map(arg => arg.toLines()));
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitRunPath(this, parameters);
  }
}

export class RunOncePath extends Stmt {
  public readonly runPath: Token;
  public readonly open: Token;
  public readonly expr: IExpr;
  public readonly close: Token;
  public readonly args?: IExpr[];

  constructor(builder: NodeDataBuilder<RunOncePath>) {
    super();

    this.runPath = unWrap(builder.runPath);
    this.open = unWrap(builder.open);
    this.expr = unWrap(builder.expr);
    this.close = unWrap(builder.close);
    this.args = builder.args;
  }

  public toLines(): string[] {
    let lines = this.expr.toLines();

    if (!empty(this.args)) {
      lines = joinLines(', ', lines, ...this.args.map(arg => arg.toLines()));
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitRunPathOnce(this, parameters);
  }
}

export class Compile extends Stmt {
  public readonly compile: Token;
  public readonly target: IExpr;
  public readonly to?: Token;
  public readonly destination?: IExpr;

  constructor(builder: NodeDataBuilder<Compile>) {
    super();

    this.compile = unWrap(builder.compile);
    this.target = unWrap(builder.target);
    this.to = builder.to;
    this.destination = builder.destination;
  }

  public toLines(): string[] {
    let lines = this.target.toLines();

    if (!empty(this.destination) && !empty(this.to)) {
      lines = joinLines(
        ` ${this.to.lexeme} `,
        lines,
        this.destination.toLines(),
      );
    }

    lines[0] = `${this.compile.lexeme} ${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
    return lines;
  }

  public get start(): Position {
    return this.compile.start;
  }

  public get end(): Position {
    return empty(this.destination) ? this.target.end : this.destination.end;
  }

  public get ranges(): Range[] {
    const ranges: Range[] = [this.compile, this.target];
    if (!empty(this.to) && !empty(this.destination)) {
      ranges.push(this.to);
      ranges.push(this.destination);
    }

    return ranges;
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitCompile(this, parameters);
  }
}

export class List extends Stmt {
  public readonly list: Token;
  public readonly collection?: Token;
  public readonly inToken?: Token;
  public readonly target?: Token;

  constructor(builder: NodeDataBuilder<List>) {
    super();

    this.list = unWrap(builder.list);
    this.collection = builder.collection;
    this.inToken = builder.inToken;
    this.target = builder.target;
  }

  public toLines(): string[] {
    if (
      !empty(this.collection) &&
      !empty(this.inToken) &&
      !empty(this.target)
    ) {
      return [
        `${this.list.lexeme} ${this.collection.lexeme} ` +
          `${this.inToken.lexeme} ${this.target.lexeme}.`,
      ];
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitList(this, parameters);
  }
}

export class Empty extends Stmt {
  constructor(public readonly empty: Token) {
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

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitEmpty(this, parameters);
  }
}

export class Print extends Stmt {
  public readonly print: Token;
  public readonly expr: IExpr;
  public readonly at?: Token;
  public readonly open?: Token;
  public readonly x?: IExpr;
  public readonly y?: IExpr;
  public readonly close?: Token;

  constructor(builder: NodeDataBuilder<Print>) {
    super();
    this.print = unWrap(builder.print);
    this.expr = unWrap(builder.expr);
    this.at = builder.at;
    this.open = builder.open;
    this.x = builder.x;
    this.y = builder.y;
    this.close = builder.close;
  }

  public toLines(): string[] {
    let lines = this.expr.toLines();
    lines[0] = `${this.print.lexeme} ${lines[0]}`;

    if (
      !empty(this.at) &&
      !empty(this.open) &&
      !empty(this.x) &&
      !empty(this.y) &&
      !empty(this.close)
    ) {
      const xLines = this.x.toLines();
      const yLines = this.y.toLines();

      xLines[0] = `${this.at.lexeme} ${this.open.lexeme}${xLines[0]}`;
      yLines[yLines.length - 1] = `${yLines[yLines.length - 1]}${
        this.close.lexeme
      }`;

      const argLines = joinLines(', ', xLines, yLines);
      lines = joinLines(' ', lines, argLines);
    }

    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
    return lines;
  }

  public get start(): Position {
    return this.print.start;
  }

  public get end(): Position {
    return empty(this.close) ? this.expr.end : this.close.end;
  }

  public get ranges(): Range[] {
    const ranges = [this.print, this.expr];

    if (
      !empty(this.at) &&
      !empty(this.open) &&
      !empty(this.x) &&
      !empty(this.y) &&
      !empty(this.close)
    ) {
      ranges.push(this.at);
      ranges.push(this.open);
      ranges.push(this.x);
      ranges.push(this.y);
      ranges.push(this.close);
    }

    return ranges;
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitPrint(this, parameters);
  }
}

export const validStatements: Constructor<Stmt>[] = [
  Block,
  ExprStmt,
  OnOff,
  Command,
  CommandExpr,
  Unset,
  Unlock,
  Set,
  LazyGlobal,
  If,
  Else,
  Until,
  From,
  When,
  Return,
  Break,
  Switch,
  For,
  On,
  Toggle,
  Wait,
  Log,
  Copy,
  Rename,
  Delete,
  Run,
  RunPath,
  RunOncePath,
  Compile,
  List,
  Empty,
  Print,
];
