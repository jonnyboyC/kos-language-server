import { Stmt, Block } from './stmt';
import { IExpr, IStmtVisitor, ScopeKind, NodeDataBuilder } from './types';
import { TokenType } from '../entities/tokentypes';
import { empty, unWrap } from '../utilities/typeGuards';
import { Range, Position } from 'vscode-languageserver';
import { joinLines } from './toStringUtils';
import { NodeBase } from './base';
import { Token } from '../entities/token';

export abstract class Decl extends Stmt {
  constructor() {
    super();
  }
}

export class Scope extends NodeBase {
  constructor(public readonly scope?: Token, public readonly declare?: Token) {
    super();
  }

  public toLines(): string[] {
    if (!empty(this.scope) && !empty(this.declare)) {
      return [`${this.declare.lexeme} ${this.scope.lexeme}`];
    }

    if (!empty(this.scope)) {
      return [this.scope.lexeme];
    }

    if (!empty(this.declare)) {
      return [this.declare.lexeme];
    }

    throw new Error('Unvalid scope encountered. No socpe or declare tokens');
  }

  public get ranges(): Range[] {
    if (!empty(this.scope) && !empty(this.declare)) {
      return [this.declare, this.scope];
    }

    if (!empty(this.scope)) {
      return [this.scope];
    }

    if (!empty(this.declare)) {
      return [this.declare];
    }

    throw new Error('Unvalid scope encountered. No socpe or declare tokens');
  }

  public get start(): Position {
    if (!empty(this.scope) && !empty(this.declare)) {
      return this.declare.start;
    }

    if (!empty(this.scope)) {
      return this.scope.start;
    }

    if (!empty(this.declare)) {
      return this.declare.start;
    }

    throw new Error('Unvalid scope encountered. No socpe or declare tokens');
  }

  public get end(): Position {
    if (!empty(this.scope) && !empty(this.declare)) {
      return this.scope.end;
    }

    if (!empty(this.scope)) {
      return this.scope.end;
    }

    if (!empty(this.declare)) {
      return this.declare.end;
    }

    throw new Error('Unvalid scope encountered. No socpe or declare tokens');
  }

  public get type(): ScopeKind {
    if (empty(this.scope)) {
      return ScopeKind.local;
    }

    switch (this.scope.type) {
      case TokenType.local:
        return ScopeKind.local;
      case TokenType.global:
        return ScopeKind.global;
      default:
        throw new Error('Unknown scope type found');
    }
  }
}

export class Var extends Decl {
  public readonly identifier: Token;
  public readonly toIs: Token;
  public readonly value: IExpr;
  public readonly scope: Scope;

  constructor(builder: NodeDataBuilder<Var>) {
    super();
    this.identifier = unWrap(builder.identifier);
    this.toIs = unWrap(builder.toIs);
    this.value = unWrap(builder.value);
    this.scope = unWrap(builder.scope);
  }

  public toLines(): string[] {
    const lines = this.value.toLines();
    lines[0] =
      `${this.scope.toString()} ${this.identifier.lexeme} ` +
      `${this.toIs.lexeme} ${lines[0]}`;

    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
    return lines;
  }

  public get start(): Position {
    return this.scope.start;
  }

  public get end(): Position {
    return this.value.end;
  }

  public get ranges(): Range[] {
    return [this.scope, this.identifier, this.toIs, this.value];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitDeclVariable(this, parameters);
  }
}

export class Lock extends Decl {
  public readonly lock: Token;
  public readonly identifier: Token;
  public readonly to: Token;
  public readonly value: IExpr;
  public readonly scope?: Scope;

  constructor(builder: NodeDataBuilder<Lock>) {
    super();
    this.lock = unWrap(builder.lock);
    this.identifier = unWrap(builder.identifier);
    this.to = unWrap(builder.to);
    this.value = unWrap(builder.value);
    this.scope = builder.scope;
  }

  public toLines(): string[] {
    const lines = this.value.toLines();
    if (empty(this.scope)) {
      lines[0] =
        `${this.lock.lexeme} ${this.identifier.lexeme} ` +
        `${this.to.lexeme} ${lines[0]}`;
    } else {
      lines[0] =
        `${this.scope.toString()} ${this.lock.lexeme} ${
          this.identifier.lexeme
        } ` + `${this.to.lexeme} ${lines[0]}`;
    }

    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;

    return lines;
  }

  public get start(): Position {
    return empty(this.scope) ? this.lock.start : this.scope.start;
  }

  public get end(): Position {
    return this.value.end;
  }

  public get ranges(): Range[] {
    if (!empty(this.scope)) {
      return [this.scope, this.lock, this.identifier, this.to, this.value];
    }

    return [this.lock, this.identifier, this.to, this.value];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitDeclLock(this, parameters);
  }
}

export class Func extends Decl {
  public readonly functionToken: Token;
  public readonly identifier: Token;
  public readonly block: Block;
  public readonly scope?: Scope;

  constructor(builder: NodeDataBuilder<Func>) {
    super();
    this.functionToken = unWrap(builder.functionToken);
    this.identifier = unWrap(builder.identifier);
    this.block = unWrap(builder.block);
    this.scope = builder.scope;
  }

  public toLines(): string[] {
    const declareLine = empty(this.scope)
      ? `${this.functionToken.lexeme} ${this.identifier.lexeme}`
      : `${this.scope.toString()} ${this.functionToken.lexeme} ${
          this.identifier.lexeme
        }`;

    const blockLines = this.block.toLines();
    return joinLines(' ', [declareLine], blockLines);
  }

  public get start(): Position {
    return empty(this.scope) ? this.functionToken.start : this.scope.start;
  }

  public get end(): Position {
    return this.block.end;
  }

  public get ranges(): Range[] {
    if (!empty(this.scope)) {
      return [this.scope, this.functionToken, this.identifier, this.block];
    }

    return [this.functionToken, this.identifier, this.block];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitDeclFunction(this, parameters);
  }
}

export class Param extends Decl {
  public readonly parameterToken: Token;
  public readonly requiredParameters: Parameter[];
  public readonly optionalParameters: DefaultParam[];
  public readonly scope?: Scope;

  constructor(builder: NodeDataBuilder<Param>) {
    super();
    this.parameterToken = unWrap(builder.parameterToken);
    this.requiredParameters = unWrap(builder.requiredParameters);
    this.optionalParameters = unWrap(builder.optionalParameters);
    this.scope = builder.scope;
  }

  public toLines(): string[] {
    const declareLine = empty(this.scope)
      ? [`${this.parameterToken.lexeme}`]
      : [`${this.scope.toString()} ${this.parameterToken.lexeme}`];

    const paramLines = joinLines(
      ', ',
      ...this.requiredParameters.map(param => param.toLines()),
    );
    const defaultParamLines = joinLines(
      ', ',
      ...this.optionalParameters.map(param => param.toLines()),
    );

    let lines: string[] = [];
    if (
      this.requiredParameters.length > 0 &&
      this.optionalParameters.length > 0
    ) {
      lines = joinLines(', ', paramLines, defaultParamLines);
    } else if (this.requiredParameters.length > 0) {
      lines = paramLines;
    } else {
      lines = defaultParamLines;
    }

    lines[0] = `${declareLine} ${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
    return lines;
  }

  public get start(): Position {
    return empty(this.scope) ? this.parameterToken.start : this.scope.start;
  }

  public get end(): Position {
    return this.optionalParameters.length > 0
      ? this.optionalParameters[this.optionalParameters.length - 1].value.end
      : this.requiredParameters[this.requiredParameters.length - 1].end;
  }

  public get ranges(): Range[] {
    if (!empty(this.scope)) {
      return [
        this.scope,
        this.parameterToken,
        ...this.requiredParameters,
        ...this.optionalParameters,
      ];
    }

    return [
      this.parameterToken,
      ...this.requiredParameters,
      ...this.optionalParameters,
    ];
  }

  public accept<T extends (...args: any) => any>(
    visitor: IStmtVisitor<T>,
    parameters: Parameters<T>,
  ): ReturnType<T> {
    return visitor.visitDeclParameter(this, parameters);
  }
}

export class Parameter extends NodeBase {
  constructor(public readonly identifier: Token) {
    super();
  }

  public toLines(): string[] {
    return [this.identifier.lexeme];
  }

  public get start(): Position {
    return this.identifier.start;
  }

  public get end(): Position {
    return this.identifier.end;
  }

  public get ranges(): Range[] {
    return [this.identifier];
  }

  public get isKeyword(): boolean {
    return this.identifier.type !== TokenType.identifier;
  }
}

export class DefaultParam extends Parameter {
  constructor(
    identifier: Token,
    public readonly toIs: Token,
    public readonly value: IExpr,
  ) {
    super(identifier);
  }

  public toLines(): string[] {
    const lines = this.value.toLines();
    lines[0] = `${this.identifier.lexeme} ${this.toIs.lexeme} ${lines[0]}`;
    return lines;
  }

  public get start(): Position {
    return this.identifier.start;
  }

  public get end(): Position {
    return this.value.end;
  }

  public get ranges(): Range[] {
    return [this.identifier, this.toIs, this.value];
  }

  public get isKeyword(): boolean {
    return this.identifier.type !== TokenType.identifier;
  }
}
