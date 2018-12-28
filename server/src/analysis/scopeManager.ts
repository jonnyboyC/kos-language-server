import { ResolverError } from './resolverError';
import { empty } from '../utilities/typeGuards';
import { ScopeType } from '../parser/types';
import { KsVariable } from '../entities/variable';
import { VariableState, IScope, IScopeNode,
  KsEntity, IStack, FunctionState, LockState,
  ParameterState,
} from './types';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { Position, Range } from 'vscode-languageserver';
import { IToken } from '../entities/types';
import { KsParameter } from '../entities/parameters';
import { positionAfterEqual, positionBeforeEqual } from '../utilities/positionHelpers';
import { connection } from '../server';
import { ScopePosition } from './scopePosition';

export class ScopeManager {
  private readonly global: IScope;
  private readonly scopesRoot: IScopeNode;
  private activeScopePath: IStack<number>;
  private backTrackPath: IStack<number>;

  public childScopes: Set<ScopeManager>;
  public parentScopes: Set<ScopeManager>;

  constructor() {
    this.global = new Map();
    this.scopesRoot = {
      scope: this.global,
      children: [],
      position: { tag: 'global' },
    };
    this.activeScopePath = [];
    this.backTrackPath = [];
    this.childScopes = new Set();
    this.parentScopes = new Set();
  }

  // rewind scope to entry point for multiple passes
  public rewindScope(): void {
    this.activeScopePath = [];
    this.backTrackPath = [];
  }

  // add a child scope manager from a file run in this file
  public addChild(childMan: ScopeManager): void {
    this.childScopes.add(childMan);
    childMan.parentScopes.add(this);
  }

  // should be called when the associated file is deleted
  public removeSelf(): void {
    // remove refernces from parent scopes
    for (const parent of this.parentScopes) {
      parent.childScopes.delete(this);
    }

    // remove references from child scopes
    for (const child of this.childScopes) {
      child.parentScopes.delete(this);
    }

    // clear own references
    this.childScopes.clear();
    this.parentScopes.clear();
  }

  // push new scope onto scope stack
  public beginScope(range: Range): void {
    const depth = this.activeScopePath.length - 1;
    const next = !empty(this.backTrackPath[depth + 1])
            ? this.backTrackPath[depth + 1] + 1 : 0;

    const activeNode = this.activeScopeNode();

    if (empty(activeNode.children[next])) {
      activeNode.children.push({
        scope: new Map(),
        position: new ScopePosition(range.start, range.end),
        children: [],
      });
    }

    connection.console.log(`begin scope at ${JSON.stringify(range.start)}`);

    this.activeScopePath.push(next);
    this.backTrackPath = [...this.activeScopePath];
  }

    // pop a scope and check entity validity
  public endScope(): ResolverError[] {
    const { scope, position } = this.activeScopeNode();
    this.activeScopePath.pop();

    const errors = [];
    if (!empty(scope)) {
      for (const entity of scope.values()) {
        switch (entity.tag) {
          case 'function':
            break;
          case 'parameter':
            break;
          case 'lock':
            entity;
            break;
          case 'variable':
            if (entity.state !== VariableState.used) {
              errors.push(new ResolverError(
                entity.name,
                `Variable ${entity.name.lexeme} was not used.`, []));
            }
            break;
          default:
            throw new Error();
        }
      }
    }

    if (position.tag === 'real') {
      connection.console.log(`end scope at ${JSON.stringify(position.end)}`);
    }
    return errors;
  }

  public entityAtPosition(pos: Position, name: string): Maybe<KsEntity> {
    const entities = this.entitiesAtPosition(pos);
    return entities.find(entity => entity.name.lexeme === name);
  }

    // get all entities in scope at a position
  public entitiesAtPosition(pos: Position): KsEntity[] {
    const entities = Array.from(this.scopesRoot.scope.values());

    return this.entitiesAtPositionDepth(pos, this.scopesRoot.children)
      .concat(entities);
  }

  // recursively move down scopes for more relevant entities
  private entitiesAtPositionDepth(pos: Position, nodes: IScopeNode[]): KsEntity[] {
    let entities: KsEntity[] = [];

    for (const node of nodes) {
      const { position } = node;
      switch (position.tag) {
        // if global it is available
        case 'global':
          entities = entities.concat(
            Array.from(node.scope.values()),
            this.entitiesAtPositionDepth(pos, node.children));
          break;
        // if the scope has a real position check if we're in the bounds
        case 'real':
          const { start, end } = position;
          if (positionBeforeEqual(start, pos) && positionAfterEqual(end, pos)) {

            entities = entities.concat(
              Array.from(node.scope.values()),
              this.entitiesAtPositionDepth(pos, node.children));
          }
      }
    }

    return entities;
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
  public useEntity(name: IToken): Maybe<ResolverError> {
    const entity = this.lookup(name, ScopeType.global);

    // check if entity exists
    if (empty(entity)) {
      return new ResolverError(name, `Entity ${name.lexeme} does not exist`, []);
    }

    // check the appropriate lookup for the entity
    switch (entity.tag) {
      case 'parameter':
        return this.checkUseParameter(name, entity);
      case 'function':
        return this.checkUseFunction(name, entity);
      case 'variable':
        return this.checkUseVariable(name, entity, VariableState.used);
      case 'lock':
        return this.checkUseLock(name, entity, LockState.used);
    }
  }

  // declare a variable
  public declareVariable(scopeType: ScopeType, name: IToken): Maybe<ResolverError> {
    const entity = this.lookup(name, ScopeType.local);

    // check if variable has already been defined
    if (!empty(entity)) {
      return this.localConflictError(name, entity);
    }

    const scope = this.selectScope(scopeType);

    scope.set(name.lexeme, new KsVariable(scopeType, name, VariableState.declared));
    connection.console.log(`declare variable ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // use a variable
  public useVariable(name: IToken): Maybe<ResolverError> {
    const variable = this.lookupVariable(name, ScopeType.global);

    return this.checkUseVariable(name, variable, VariableState.used);
  }

  // define a variable
  public defineVariable(name: IToken): Maybe<ResolverError> {
    const variable = this.lookupVariable(name, ScopeType.global);

    const state = empty(variable) ? VariableState.declared : variable.state;
    return this.checkUseVariable(name, variable, state);
  }

  // check if a variable exist then use it
  public checkUseVariable(name: IToken, variable: Maybe<KsVariable>, state: VariableState):
    Maybe<ResolverError> {
    // check that variable has already been defined
    if (empty(variable)) {
      return new ResolverError(name, `Variable ${name.lexeme} does not exist.`, []);
    }

    variable.state = state;
    connection.console.log(`use variable ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // declare a variable
  public declareFunction(
    scopeType: ScopeType,
    name: IToken,
    parameters: KsParameter[],
    returnValue: boolean): Maybe<ResolverError> {
    const entity = this.lookup(name, ScopeType.local);

    // check if variable has already been defined
    if (!empty(entity)) {
      return this.localConflictError(name, entity);
    }

    const scope = this.selectScope(scopeType);
    scope.set(name.lexeme, new KsFunction(
            scopeType, name,
            parameters, returnValue,
            FunctionState.declared));

    connection.console.log(`declare function ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // define a variable
  public useFunction(name: IToken): Maybe<ResolverError> {
    const func = this.lookupFunction(name, ScopeType.global);

    return this.checkUseFunction(name, func);
  }

  // check that a function exists then use it
  private checkUseFunction(name: IToken, func: Maybe<KsFunction>): Maybe<ResolverError> {
    // check that function has already been defined
    if (empty(func)) {
      return new ResolverError(name, `Function ${name.lexeme} does not exist.`, []);
    }

    func.state = FunctionState.used;
    connection.console.log(`use function ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // declare a variable
  public declareLock(scopeType: ScopeType, name: IToken): Maybe<ResolverError> {
    const entity = this.lookup(name, ScopeType.local);

    // check if variable has already been defined
    if (!empty(entity) && entity.tag !== 'lock') {
      return this.localConflictError(name, entity);
    }

    const scope = this.selectScope(scopeType);
    const state = this.lockState(name.lexeme);

    scope.set(name.lexeme, new KsLock(scopeType, name, state));
    connection.console.log(`declare lock ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // locks with side effects are considerd used immediatly
  private lockState(lockName: string): LockState {
    switch (lockName) {
      case 'throttle':
      case 'steering':
      case 'wheelthrottle':
      case 'wheelsteering':
        return LockState.used;
      default:
        return LockState.locked;
    }
  }

  // use a variable
  public useLock(name: IToken, newState: LockState.unlocked | LockState.used):
    Maybe<ResolverError> {
    const lock = this.lookupLock(name, ScopeType.global);

    return this.checkUseLock(name, lock, newState);
  }

  // check that the lock can be used in the current state
  private checkUseLock(name: IToken, lock: Maybe<KsLock>, newState: LockState) {

    // check that variable has already been defined
    if (empty(lock)) {
      return new ResolverError(name, `Lock ${name.lexeme} does not exist.`, []);
    }

    if (lock.state === LockState.unlocked) {
      return new ResolverError(name, `Lock ${name.lexeme} is unlocked.`, []);
    }

    lock.state = newState;
    connection.console.log(`use lock ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // declare a parameter
  public declareParameter(
    scopeType: ScopeType,
    name: IToken,
    defaulted: boolean): Maybe<ResolverError> {
    const entity = this.lookup(name, ScopeType.local);

    // check if variable has already been defined
    if (!empty(entity)) {
      return this.localConflictError(name, entity);
    }

    const scope = this.selectScope(scopeType);
    scope.set(name.lexeme, new KsParameter(name, defaulted, ParameterState.declared));
    connection.console.log(`declare parameter ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // use a parameter
  public useParameter(name: IToken): Maybe<ResolverError> {
    const parameter = this.lookupParameter(name, ScopeType.global);

    return this.checkUseParameter(name, parameter);
  }

  // check that the parameter can be used in this state
  private checkUseParameter(name: IToken, parameter: Maybe<KsParameter>): Maybe<ResolverError> {

    // check that parmeter has already been defined
    if (empty(parameter)) {
      return new ResolverError(name, `Parameter ${name.lexeme} does not exist.`, []);
    }

    parameter.state = ParameterState.used;
    connection.console.log(`use parameter ${name.lexeme} at ${JSON.stringify(name.start)}`);
    return undefined;
  }

  // attempt a variable lookup
  public lookupVariable(token: IToken, scope: ScopeType): Maybe<KsVariable> {
    const entity = this.lookup(token, scope);
    return !empty(entity) && entity.tag === 'variable'
      ? entity
      : undefined;
  }

  // lockup a function
  public lookupFunction(token: IToken, scope: ScopeType): Maybe<KsFunction> {
    const entity = this.lookup(token, scope);
    return !empty(entity) && entity.tag === 'function'
      ? entity
      : undefined;
  }

  // lookup a lock
  public lookupLock(token: IToken, scope: ScopeType): Maybe<KsLock> {
    const entity = this.lookup(token, scope);
    return !empty(entity) && entity.tag === 'lock'
      ? entity
      : undefined;
  }

  // lookup a parameter
  public lookupParameter(token: IToken, scope: ScopeType): Maybe<KsParameter> {
    const entity = this.lookup(token, scope);
    return !empty(entity) && entity.tag === 'parameter'
      ? entity
      : undefined;
  }

  // attempt a entity lookup
  private lookup(token: IToken, scope: ScopeType): Maybe<KsEntity> {
    if (scope === ScopeType.local) {
      return this.peekScope().get(token.lexeme);
    }

    const scopes = this.activeScopeStack();
    // tslint:disable-next-line:no-increment-decrement
    for (let i = scopes.length - 1; i >= 0; i--) {
      const scope = scopes[i];
      const entity = scope.get(token.lexeme);
      if (!empty(entity)) {
        return entity;
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
    return `line: ${position.line} column: ${position.character}`;
  }

  // to pascal case
  private pascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
