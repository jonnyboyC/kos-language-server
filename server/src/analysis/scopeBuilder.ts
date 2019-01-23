import { ResolverError } from './resolverError';
import { empty } from '../utilities/typeGuards';
import { ScopeType, IExpr } from '../parser/types';
import { KsVariable } from '../entities/variable';
import { EntityState, IScope, IScopeNode,
  KsEntity, IStack, IKsEntityTracker,
} from './types';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { Position, Range } from 'vscode-languageserver';
import { IToken } from '../entities/types';
import { KsParameter } from '../entities/parameters';
import { ScopePosition } from './scopePosition';
import { mockLogger } from '../utilities/logger';
import { Scope } from './scope';
import { createTracker, createUsage } from './tracker';
import { IType } from '../typeChecker/types/types';
import { ScopeManager } from './scopeManager';

export class ScopeBuilder {
  private readonly global: IScope;
  private readonly scopesRoot: IScopeNode;
  private activeScopePath: IStack<number>;
  private backTrackPath: IStack<number>;

  public outScopes: Set<ScopeManager>;
  public logger: ILogger;

  constructor(logger: ILogger = mockLogger) {
    this.logger = logger;
    this.global = new Scope();
    this.scopesRoot = {
      scope: this.global,
      children: [],
      position: { tag: 'global' },
    };
    this.activeScopePath = [];
    this.backTrackPath = [];
    this.outScopes = new Set();
  }

  public build(): ScopeManager {
    return new ScopeManager(
      this.scopesRoot,
      this.outScopes,
      this.logger,
    );
  }

  // rewind scope to entry point for multiple passes
  public rewindScope(): void {
    this.activeScopePath = [];
    this.backTrackPath = [];
  }

  // add a child scope manager from a file run in this file
  public addScope(scopeMan: ScopeManager): void {
    this.outScopes.add(scopeMan);
  }

  // push new scope onto scope stack
  public beginScope(range: Range): void {
    const depth = this.activeScopePath.length - 1;
    const next = !empty(this.backTrackPath[depth + 1])
      ? this.backTrackPath[depth + 1] + 1 : 0;

    const activeNode = this.activeScopeNode();

    if (empty(activeNode.children[next])) {
      activeNode.children.push({
        scope: new Scope(),
        position: new ScopePosition(range.start, range.end),
        children: [],
      });
    }

    this.logger.info(`begin scope at ${JSON.stringify(range.start)}`);

    this.activeScopePath.push(next);
    this.backTrackPath = [...this.activeScopePath];
  }

  // pop a scope and check entity validity
  public endScope(): ResolverError[] {
    const { scope, position } = this.activeScopeNode();
    this.activeScopePath.pop();

    const errors = [];
    if (!empty(scope)) {
      for (const tracker of scope.values()) {
        switch (tracker.declared.entity.tag) {
          case 'function':
            break;
          case 'parameter':
            if (tracker.usages.length === 0) {
              errors.push(new ResolverError(
                tracker.declared.entity.name,
                `Parameter ${tracker.declared.entity.name.lexeme} was not used.`, []));
            }
            break;
          case 'lock':
            if (!tracker.declared.entity.cooked && tracker.usages.length === 0) {
              errors.push(new ResolverError(
                tracker.declared.entity.name,
                `Lock ${tracker.declared.entity.name.lexeme} was not used.`, []));
            }
            break;
          case 'variable':
            if (tracker.usages.length === 0) {
              errors.push(new ResolverError(
                tracker.declared.entity.name,
                `Variable ${tracker.declared.entity.name.lexeme} was not used.`, []));
            }
            break;
          default:
            throw new Error();
        }
      }
    }

    if (position.tag === 'real') {
      this.logger.info(`end scope at ${JSON.stringify(position.end)}`);
    }
    return errors;
  }

  // is the current scope in file
  public isFileScope(): boolean {
    return this.scopeDepth() === 2;
  }

  // is the current scope in global
  public isGlobalScope(): boolean {
    return this.activeScopeNode() === this.scopesRoot;
  }

  // the current scope depth
  public scopeDepth(): number {
    return this.activeScopeStack().length;
  }

  // attempt to use an entity
  public useEntity(name: IToken, expr: IExpr): Maybe<ResolverError> {
    const tracker = this.lookup(name, ScopeType.global);

    // check if entity exists
    if (empty(tracker)) {
      return new ResolverError(name, `Entity ${name.lexeme} may not exist`, []);
    }

    // check the appropriate lookup for the entity
    switch (tracker.declared.entity.tag) {
      case 'parameter':
        return this.checkUseEntity(name, tracker, 'Parameter', expr);
      case 'function':
        return this.checkUseEntity(name, tracker, 'Function', expr);
      case 'variable':
        return this.checkUseEntity(name, tracker, 'Variable', expr);
      case 'lock':
        return this.checkUseEntity(name, tracker, 'Lock', expr);
    }
  }

  // use a variable
  public useVariable(name: IToken, expr?: IExpr): Maybe<ResolverError> {
    const variable = this.lookupVariableTracker(name, ScopeType.global);

    return this.checkUseEntity(name, variable, 'Variable', expr);
  }

  // define a variable
  public useFunction(name: IToken, expr?: IExpr): Maybe<ResolverError> {
    const func = this.lookupFunctionTracker(name, ScopeType.global);

    return this.checkUseEntity(name, func, 'Function', expr);
  }

  // use a variable
  public useLock(name: IToken, expr?: IExpr):
    Maybe<ResolverError> {
    const lock = this.lookupLockTracker(name, ScopeType.global);

    return this.checkUseEntity(name, lock, 'Lock', expr);
  }

  // use a parameter
  public useParameter(name: IToken, expr: IExpr): Maybe<ResolverError> {
    const parameter = this.lookupParameterTracker(name, ScopeType.global);

    return this.checkUseEntity(name, parameter, 'Parameter', expr);
  }

  // declare a variable
  public declareVariable(scopeType: ScopeType, name: IToken, type?: IType):
    Maybe<ResolverError> {
    const tracker = this.lookup(name, ScopeType.local);

    // check if variable has already been defined
    if (!empty(tracker)) {
      return this.localConflictError(name, tracker.declared.entity);
    }

    const scope = this.selectScope(scopeType);

    scope.set(name.lexeme, createTracker(new KsVariable(scopeType, name), type));
    this.logger.info(`declare variable ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // declare a variable
  public declareFunction(
    scopeType: ScopeType,
    name: IToken,
    parameters: KsParameter[],
    returnValue: boolean,
    type?: IType): Maybe<ResolverError> {
    const tracker = this.lookup(name, ScopeType.local);

    // check if variable has already been defined
    if (!empty(tracker)) {
      return this.localConflictError(name, tracker.declared.entity);
    }

    const scope = this.selectScope(scopeType);
    scope.set(name.lexeme, createTracker(
      new KsFunction(
        scopeType, name,
        parameters, returnValue),
      type));

    this.logger.info(`declare function ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // declare a variable
  public declareLock(scopeType: ScopeType, name: IToken): Maybe<ResolverError> {
    const tracker = this.lookup(name, ScopeType.local);

    // check if variable has already been defined
    if (!empty(tracker)) {
      return this.localConflictError(name, tracker.declared.entity);
    }

    const scope = this.selectScope(scopeType);

    scope.set(
      name.lexeme,
      createTracker(new KsLock(scopeType, name)));
    this.logger.info(`declare lock ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // declare a parameter
  public declareParameter(
    scopeType: ScopeType,
    name: IToken,
    defaulted: boolean): Maybe<ResolverError> {
    const tracker = this.lookup(name, ScopeType.local);

    // check if variable has already been defined
    if (!empty(tracker)) {
      return this.localConflictError(name, tracker.declared.entity);
    }

    const scope = this.selectScope(scopeType);
    scope.set(
      name.lexeme,
      createTracker(new KsParameter(name, defaulted, EntityState.declared)));
    this.logger.info(`declare parameter ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // define a variable
  public defineBinding(name: IToken, expr?: IExpr): Maybe<ResolverError> {
    const binding = this.lookup(name, ScopeType.global);

    // Note we are currently setting to used because we can't
    // suffixes yet
    // const state = empty(binding) ? EntityState.declared : binding.state;
    return this.checkUseEntity(name, binding, 'entity', expr);
  }

  // check if a variable exist then use it
  public checkUseEntity(
    name: IToken,
    tracker: Maybe<IKsEntityTracker>,
    type: string,
    expr?: IExpr):
    Maybe<ResolverError> {
    // check that variable has already been defined
    if (empty(tracker)) {
      return new ResolverError(name, `${type} ${name.lexeme} may not exist.`, []);
    }

    tracker.usages.push(createUsage(name.location(), expr));
    this.logger.info(`Use ${type} ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // lookup a binding
  public lookupBinding (token: IToken, scope: ScopeType):
  Maybe<KsVariable | KsParameter> {
    const tracker = this.lookupBindingTracker(token, scope);
    return tracker && tracker.declared.entity;
  }

  // lookup a variable
  public lookupVariable(token: IToken, scope: ScopeType): Maybe<KsVariable> {
    const tracker = this.lookupVariableTracker(token, scope);
    return tracker && tracker.declared.entity;
  }

  // lockup a function
  public lookupFunction(token: IToken, scope: ScopeType): Maybe<KsFunction> {
    const tracker = this.lookupFunctionTracker(token, scope);
    return tracker && tracker.declared.entity;
  }

  // lookup a lock
  public lookupLock(token: IToken, scope: ScopeType): Maybe<KsLock> {
    const tracker = this.lookupLockTracker(token, scope);
    return tracker && tracker.declared.entity;
  }

  // lookup a parameter
  public lookupParameter(token: IToken, scope: ScopeType): Maybe<KsParameter> {
    const tracker = this.lookupParameterTracker(token, scope);
    return tracker && tracker.declared.entity;
  }

  // lookup a binding tracker
  public lookupBindingTracker(token: IToken, scope: ScopeType):
    Maybe<IKsEntityTracker<KsVariable | KsParameter>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker)
      && (tracker.declared.entity.tag === 'variable'
      || tracker.declared.entity.tag === 'parameter')
      ? tracker as IKsEntityTracker<KsVariable | KsParameter>
      : undefined;
  }

  // lookup a variable tracker
  public lookupVariableTracker(token: IToken, scope: ScopeType):
    Maybe<IKsEntityTracker<KsVariable>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker) && tracker.declared.entity.tag === 'variable'
      ? tracker as IKsEntityTracker<KsVariable>
      : undefined;
  }

  // lockup a function tracker
  public lookupFunctionTracker(token: IToken, scope: ScopeType):
    Maybe<IKsEntityTracker<KsFunction>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker) && tracker.declared.entity.tag === 'variable'
      ? tracker as IKsEntityTracker<KsFunction>
      : undefined;
  }

  // lookup a lock tracker
  public lookupLockTracker(token: IToken, scope: ScopeType):
    Maybe<IKsEntityTracker<KsLock>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker) && tracker.declared.entity.tag === 'lock'
      ? tracker as IKsEntityTracker<KsLock>
      : undefined;
  }

  // lookup a parameter tracker
  public lookupParameterTracker(token: IToken, scope: ScopeType):
    Maybe<IKsEntityTracker<KsParameter>> {
    const tracker = this.lookup(token, scope);

    return !empty(tracker) && tracker.declared.entity.tag === 'parameter'
      ? tracker as IKsEntityTracker<KsParameter>
      : undefined;
  }

  // attempt a entity lookup
  private lookup(token: IToken, scope: ScopeType): Maybe<IKsEntityTracker> {
    if (scope === ScopeType.local) {
      return this.peekScope().get(token.lexeme);
    }

    const scopes = this.activeScopeStack();
    // tslint:disable-next-line:no-increment-decrement
    for (let i = scopes.length - 1; i >= 0; i--) {
      const scope = scopes[i];
      const tracker = scope.get(token.lexeme);
      if (!empty(tracker)) {
        return tracker;
      }
    }

    // check child scopes entity is in another file
    for (const child of this.outScopes) {
      const tracker = child.scopesRoot.scope.get(token.lexeme);
      if (!empty(tracker)) {
        return tracker;
      }
    }

    return undefined;
  }

  // determine which scope should be used
  private selectScope(type: ScopeType): IScope {
    return type === ScopeType.global
      ? this.global
      : this.peekScope();
  }

  // get the active node
  private activeScopeNode(): IScopeNode {
    let scopeNode = this.scopesRoot;

    for (const scopeId of this.activeScopePath) {
      scopeNode = scopeNode.children[scopeId];

      if (empty(scopeNode)) {
        throw new Error(`Unable to find scope node for path ${
          JSON.stringify(this.activeScopePath)}`);
      }
    }

    return scopeNode;
  }

  // generate the active scope stack
  private activeScopeStack(): IStack<IScope> {
    const scopes: IStack<IScope> = [this.scopesRoot.scope];
    let scopeNode = this.scopesRoot;

    for (const scopeId of this.activeScopePath) {
      scopeNode = scopeNode.children[scopeId];

      if (empty(scopeNode)) {
        throw new Error(`Unable to find scope stack for path ${
          JSON.stringify(this.activeScopePath)}`);
      }
      scopes.push(scopeNode.scope);
    }

    return scopes;
  }

  // peek the current scope
  private peekScope(): IScope {
    return this.activeScopeNode().scope;
  }

  // generate local variable conflict error
  private localConflictError(name: IToken, entity: KsEntity): ResolverError {
    return new ResolverError(
      name, `${this.pascalCase(entity.tag)} ${entity.name.lexeme}`
        + ` already exists here ${this.positionToString(entity.name.start)}.`,
      []);
  }

  // generate a position string
  private positionToString(position: Position): string {
    return `line: ${position.line + 1} column: ${position.character + 1}`;
  }

  // to pascal case
  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
