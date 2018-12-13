import { IToken } from "../scanner/types";
import { ResolverError } from "./resolverError";
import { empty } from "../utilities/typeGuards";
import { ScopeType } from "../parser/types";
import { KsVariable } from "./variable";
import { VariableState, IScope, IScopeNode, KsEntity, IStack, FunctionState, LockState, ParameterState } from "./types";
import { KsFunction } from "./function";
import { KsLock } from "./lock";
import { KsParameter } from "./parameters";
import { Position } from "vscode-languageserver";

export class ScopeManager {
    private readonly _global: IScope;
    private readonly _scopesRoot: IScopeNode;
    private _activeScopePath: IStack<number>;
    private _backTrackPath: IStack<number>;

    constructor() {
        this._global = new Map();
        this._scopesRoot = { scope: this._global, children: []};
        this._activeScopePath = []
        this._backTrackPath = [];
    }

    // rewind scope to entry point for multiple passes
    public rewindScope(): void {
        this._activeScopePath = [];
        this._backTrackPath = [];
    }

    // push new scope onto scope stack
    public beginScope(): void {
        const depth = this._activeScopePath.length - 1;
        const next = !empty(this._backTrackPath[depth + 1])
            ? this._backTrackPath[depth + 1] + 1 : 0;

        const activeNode = this.activeScopeNode();

        if (empty(activeNode.children[next])) {
            activeNode.children.push({scope: new Map(), children: []});
        }

        this._activeScopePath.push(next);
        this._backTrackPath = [...this._activeScopePath]
    }

    // pop a scope and check entity validity
    public endScope(): ResolverError[] {
        const { scope } = this.activeScopeNode();
        this._activeScopePath.pop();

        const errors = [];
        if (!empty(scope)) {
            for (const entity of scope.values()) {
                switch (entity.tag) {
                    case 'function':
                        break;
                    case 'parameter':
                        break;
                    case 'lock':
                        entity
                        break;
                    case 'variable':
                        if (entity.state !== VariableState.used) {
                            errors.push(new ResolverError(entity.name, `Variable ${entity.name.lexeme} was not used.`, []))
                        }
                        break;
                    default:
                        throw new Error();
                }
            }
        }

        return [];
    }

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

        scope.set(name.lexeme, new KsVariable(scopeType, name, VariableState.declared))
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

    public checkUseVariable(name: IToken, variable: Maybe<KsVariable>, state: VariableState): Maybe<ResolverError> {
        // check that variable has already been defined
        if (empty(variable)) {
            return new ResolverError(name, `Variable ${name.lexeme} does not exist.`, []);
        }

        variable.state = state;
        return undefined;
    }

    // declare a variable
    public declareFunction(scopeType: ScopeType,
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
            FunctionState.declared))
        return undefined;
    }

    // define a variable
    public useFunction(name: IToken): Maybe<ResolverError> {
        const func = this.lookupFunction(name, ScopeType.global);

        return this.checkUseFunction(name, func); 
    }

    private checkUseFunction(name: IToken, func: Maybe<KsFunction>,): Maybe<ResolverError> {
        // check that function has already been defined
        if (empty(func)) {
            return new ResolverError(name, `Function ${name.lexeme} does not exist.`, []);
        }

        func.state = FunctionState.used;
        return undefined;
    }

    // declare a variable
    public declareLock(scopeType: ScopeType, name: IToken): Maybe<ResolverError> {
        const entity = this.lookup(name, ScopeType.local);

        // check if variable has already been defined
        if (!empty(entity)) {
            return this.localConflictError(name, entity);
        }

        const scope = this.selectScope(scopeType);
        const state = this.lockState(name.lexeme);

        scope.set(name.lexeme, new KsLock(scopeType, name, state));
        return undefined;
    }

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
    public useLock(name: IToken, newState: LockState.unlocked | LockState.used): Maybe<ResolverError> {
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
            return new ResolverError(name, `Lock ${name.lexeme} is unlocked.`, [])
        }

        lock.state = newState
        return undefined;
    }

    // declare a parameter
    public declareParameter(scopeType: ScopeType,
        name: IToken, 
        defaulted: boolean): Maybe<ResolverError> {
        const entity = this.lookup(name, ScopeType.local);

        // check if variable has already been defined
        if (!empty(entity)) {
            return this.localConflictError(name, entity);
        }

        const scope = this.selectScope(scopeType);
        scope.set(name.lexeme, new KsParameter(name, defaulted, ParameterState.declared))
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
        return type == ScopeType.global
            ? this._global
            : this.peekScope();
    }

    // get the active node
    private activeScopeNode(): IScopeNode {
        let scopeNode = this._scopesRoot;

        for (const scopeId of this._activeScopePath) {
            scopeNode = scopeNode.children[scopeId];

            if (empty(scopeNode)) {
                throw new Error(`Unable to find scope node for path ${JSON.stringify(this._activeScopePath)}`);
            }
        }

        return scopeNode;
    }

    // generate the active scope stack
    private activeScopeStack(): IStack<IScope> {
        const scopes: IStack<IScope> = [this._scopesRoot.scope];
        let scopeNode = this._scopesRoot;

        for (const scopeId of this._activeScopePath) {
            scopeNode = scopeNode.children[scopeId];

            if (empty(scopeNode)) {
                throw new Error(`Unable to find scope stack for path ${JSON.stringify(this._activeScopePath)}`);
            }
            scopes.push(scopeNode.scope)
        }

        return scopes;
    }

    // peek the current scope
    private peekScope(): IScope {
        return this.activeScopeNode().scope;
    }

    // generate local variable conflict error
    private localConflictError(name: IToken, entity: KsEntity): ResolverError {
        return new ResolverError(name, `${this.pascalCase(entity.tag)} ${entity.name.lexeme}`
        +` already exists here ${this.positionToString(entity.name.start)}.`, []);
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