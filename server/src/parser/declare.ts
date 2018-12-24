import { Inst, BlockInst } from './inst';
import { IDeclScope, IExpr, IInstVisitor, ScopeType } from './types';
import { TokenType } from '../entities/tokentypes';
import { empty } from '../utilities/typeGuards';
import { IToken } from '../entities/types';
import { Range } from 'vscode-languageserver';

export abstract class Decl extends Inst {
  constructor() {
    super();
  }
}

export class DeclScope implements IDeclScope {
  constructor(
    public readonly scope?: IToken,
    public readonly declare?: IToken) {
  }

  public get range(): Range {
    if (!empty(this.scope) && !empty(this.declare)) {
      return {
        start: this.declare.start,
        end: this.scope.end,
      };
    }

    if (!empty(this.scope)) {
      return {
        start: this.scope.start,
        end: this.scope.end,
      };
    }

    if (!empty(this.declare)) {
      return {
        start: this.declare.start,
        end: this.declare.end,
      };
    }

    throw new Error('Unvalid scope encountered. No socpe or declare tokens');
  }

  public get type(): ScopeType {
    if (empty(this.scope)) {
      return ScopeType.local;
    }

    switch (this.scope.type) {
      case TokenType.Local:
        return ScopeType.local;
      case TokenType.Global:
        return ScopeType.global;
      default:
        throw new Error('Unknown scope type found');
    }
  }
}

export class DeclVariable extends Decl {
  constructor(
    public readonly suffix: IExpr,
    public readonly toIs: IToken,
    public readonly expression: IExpr,
    public readonly scope: IDeclScope) {
    super();
  }

  public get range(): Range {
    return {
      start: this.scope.range.start,
      end: this.expression.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclVariable(this);
  }
}

export class DeclLock extends Decl {
  constructor(
    public readonly lock: IToken,
    public readonly identifier: IToken,
    public readonly to: IToken,
    public readonly value: IExpr,
    public readonly scope?: IDeclScope) {
    super();
  }

  get range(): Range {
    return {
      start: empty(this.scope)
        ? this.lock.start
        : this.scope.range.start,
      end: this.value.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclLock(this);
  }
}

export class DeclFunction extends Decl {
  constructor(
    public readonly functionToken: IToken,
    public readonly functionIdentifier: IToken,
    public readonly instructionBlock: BlockInst,
    public readonly scope?: IDeclScope) {
    super();
  }

  get range(): Range {
    return {
      start: empty(this.scope)
        ? this.functionToken.start
        : this.scope.range.start,
      end: this.instructionBlock.range.end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclFunction(this);
  }
}

export class Parameter {
  constructor(
    public readonly identifier: IToken) {
  }

  public get isKeyword(): boolean {
    return !(this.identifier.type === TokenType.Identifier
            || this.identifier.type === TokenType.FileIdentifier);
  }
}

export class DefaultParameter {
  constructor(
        public readonly identifier: IToken,
        public readonly toIs: IToken,
        public readonly value: IExpr) {
  }

  get isKeyword(): boolean {
    return this.identifier.type !== TokenType.Identifier;
  }
}

export class DeclParameter extends Decl {
  constructor(
    public readonly parameterToken: IToken,
    public readonly parameters: IToken[],
    public readonly defaultParameters: DefaultParameter[],
    public readonly scope?: IDeclScope) {
    super();
  }

  get range(): Range {
    return {
      start: empty(this.scope)
        ? this.parameterToken.start
        : this.scope.range.start,
      end: this.defaultParameters.length > 0
        ? this.defaultParameters[this.defaultParameters.length - 1].identifier.end
        : this.parameters[this.parameters.length - 1].end,
    };
  }

  public accept<T>(visitor: IInstVisitor<T>): T {
    return visitor.visitDeclParameter(this);
  }
}
