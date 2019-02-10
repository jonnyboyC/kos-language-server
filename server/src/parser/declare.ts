import { Inst, Block } from './inst';
import { IDeclScope, IExpr, IInstVisitor, ScopeType } from './types';
import { TokenType } from '../entities/tokentypes';
import { empty } from '../utilities/typeGuards';
import { IToken } from '../entities/types';
import { Range, Position } from 'vscode-languageserver';

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
    public readonly expression: IExpr,
    public readonly scope: IDeclScope) {
    super();
  }

  public get start(): Position {
    return this.scope.start;
  }

  public get end(): Position {
    return this.expression.end;
  }

  public get ranges(): Range[] {
    return [this.scope, this.identifier, this.toIs, this.expression];
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

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclLock(this);
  }
}

export class Func extends Decl {
  constructor(
    public readonly functionToken: IToken,
    public readonly functionIdentifier: IToken,
    public readonly instructionBlock: Block,
    public readonly scope?: IDeclScope) {
    super();
  }

  public get start(): Position {
    return empty(this.scope)
      ? this.functionToken.start
      : this.scope.start;
  }

  public get end(): Position {
    return this.instructionBlock.end;
  }

  public get ranges(): Range[] {
    if (!empty(this.scope)) {
      return [
        this.scope, this.functionToken,
        this.functionIdentifier, this.instructionBlock,
      ];
    }

    return [
      this.functionToken, this.functionIdentifier,
      this.instructionBlock,
    ];
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclFunction(this);
  }
}

export class Parameter implements Range {
  constructor(
    public readonly identifier: IToken) {
  }

  public get start(): Position {
    return this.identifier.start;
  }

  public get end(): Position {
    return this.identifier.end;
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

  public get start(): Position {
    return this.identifier.start;
  }

  public get end(): Position {
    return this.value.end;
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

  public get start(): Position {
    return empty(this.scope)
      ? this.parameterToken.start
      : this.scope.start;
  }

  public get end(): Position {
    return this.defaultParameters.length > 0
      ? this.defaultParameters[this.defaultParameters.length - 1].identifier.end
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

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclParameter(this);
  }
}
