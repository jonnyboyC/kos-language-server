import { Inst, Block } from './inst';
import { IDeclScope, IExpr, IInstVisitor, ScopeType, IParameter, IInstPasser } from './types';
import { TokenType } from '../entities/tokentypes';
import { empty } from '../utilities/typeGuards';
import { IToken } from '../entities/types';
import { Range, Position } from 'vscode-languageserver';
import { joinLines } from './toStringUtils';

export abstract class Decl extends Inst {
  constructor() {
    super();
  }
}

export class Scope implements IDeclScope {
  constructor(
    public readonly scope?: IToken,
    public readonly declare?: IToken) {
  }

  public toString(): string {
    if (!empty(this.scope) && !empty(this.declare)) {
      return `${this.declare.lexeme} ${this.scope.lexeme}`;
    }

    if (!empty(this.scope)) {
      return this.scope.lexeme;
    }

    if (!empty(this.declare)) {
      return this.declare.lexeme;
    }

    throw new Error('Unvalid scope encountered. No socpe or declare tokens');
  }

  public get ranges(): Range[] {
    if (!empty(this.scope) && !empty(this.declare)) {
      return [this.declare, this.scope]
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

  public get type(): ScopeType {
    if (empty(this.scope)) {
      return ScopeType.local;
    }

    switch (this.scope.type) {
      case TokenType.local:
        return ScopeType.local;
      case TokenType.global:
        return ScopeType.global;
      default:
        throw new Error('Unknown scope type found');
    }
  }
}

export class Var extends Decl {
  constructor(
    public readonly identifier: IToken,
    public readonly toIs: IToken,
    public readonly value: IExpr,
    public readonly scope: IDeclScope) {
    super();
  }

  public toLines(): string[] {
    const lines = this.value.toLines();
    lines[0] = `${this.scope.toString()} ${this.identifier.lexeme} `
      + `${this.toIs.lexeme} ${lines[0]}`;

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

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passDeclVariable(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclVariable(this);
  }
}

export class Lock extends Decl {
  constructor(
    public readonly lock: IToken,
    public readonly identifier: IToken,
    public readonly to: IToken,
    public readonly value: IExpr,
    public readonly scope?: IDeclScope) {
    super();
  }

  public toLines(): string[] {
    const lines = this.value.toLines();
    if (empty(this.scope)) {
      lines[0] = `${this.lock.lexeme} ${this.identifier.lexeme} `
        + `${this.to.lexeme} ${lines[0]}`;
    } else {
      lines[0] = `${this.scope.toString()} ${this.lock.lexeme} ${this.identifier.lexeme} `
        + `${this.to.lexeme} ${lines[0]}`;
    }

    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;

    return lines;
  }

  public get start(): Position {
    return empty(this.scope)
      ? this.lock.start
      : this.scope.start;
  }

  public get end(): Position {
    return this.value.end;
  }

  public get ranges(): Range[] {
    if (!empty(this.scope)) {
      return [
        this.scope, this.lock,
        this.identifier, this.to,
        this.value,
      ];
    }

    return [
      this.lock, this.identifier,
      this.to, this.value,
    ];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passDeclLock(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclLock(this);
  }
}

export class Func extends Decl {
  constructor(
    public readonly functionToken: IToken,
    public readonly identifier: IToken,
    public readonly block: Block,
    public readonly scope?: IDeclScope) {
    super();
  }

  public toLines(): string[] {
    const declareLine = empty(this.scope)
      ? `${this.functionToken.lexeme} ${this.identifier.lexeme}`
      : `${this.scope.toString()} ${this.functionToken.lexeme} ${this.identifier.lexeme}`;

    const blockLines = this.block.toLines();
    return joinLines(' ', [declareLine], blockLines);
  }

  public get start(): Position {
    return empty(this.scope)
      ? this.functionToken.start
      : this.scope.start;
  }

  public get end(): Position {
    return this.block.end;
  }

  public get ranges(): Range[] {
    if (!empty(this.scope)) {
      return [
        this.scope, this.functionToken,
        this.identifier, this.block,
      ];
    }

    return [
      this.functionToken, this.identifier,
      this.block,
    ];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passDeclFunction(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclFunction(this);
  }
}

export class Parameter implements IParameter {
  constructor(
    public readonly identifier: IToken) { }

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
    identifier: IToken,
    public readonly toIs: IToken,
    public readonly value: IExpr) {
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

export class Param extends Decl {
  constructor(
    public readonly parameterToken: IToken,
    public readonly parameters: Parameter[],
    public readonly defaultParameters: DefaultParam[],
    public readonly scope?: IDeclScope) {
    super();
  }

  public toLines(): string[] {
    const declareLine = empty(this.scope)
      ? [`${this.parameterToken.lexeme}`]
      : [`${this.scope.toString()} ${this.parameterToken.lexeme}`];

    const paramLines = joinLines(
      ', ', ...this.parameters.map(param => param.toLines()));
    const defaultParamLines = joinLines(
      ', ', ...this.defaultParameters.map(param => param.toLines()));

    let lines: string[] = [];
    if (this.parameters.length > 0 && this.defaultParameters.length > 0) {
      lines = joinLines(', ', paramLines, defaultParamLines);
    } else if (this.parameters.length > 0) {
      lines = paramLines;
    } else {
      lines = defaultParamLines;
    }

    lines[0] = `${declareLine} ${lines[0]}`;
    lines[lines.length - 1] = `${lines[lines.length - 1]}.`;
    return lines;
  }

  public get start(): Position {
    return empty(this.scope)
      ? this.parameterToken.start
      : this.scope.start;
  }

  public get end(): Position {
    return this.defaultParameters.length > 0
      ? this.defaultParameters[this.defaultParameters.length - 1].value.end
      : this.parameters[this.parameters.length - 1].end;
  }

  public get ranges(): Range[] {
    if (!empty(this.scope)) {
      return [
        this.scope, this.parameterToken,
        ...this.parameters,
        ...this.defaultParameters,
      ];
    }

    return [
      this.parameterToken,
      ...this.parameters,
      ...this.defaultParameters,
    ];
  }

  public pass<T>(visitor: IInstPasser<T>): T {
    return visitor.passDeclParameter(this);
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclParameter(this);
  }
}
