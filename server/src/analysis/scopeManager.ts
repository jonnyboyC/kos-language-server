import { IScopeNode,
  KsEntity, GraphNode, IKsEntityTracker, EntityType,
} from './types';
import { Position, Range } from 'vscode-languageserver';
import { positionAfterEqual, positionBeforeEqual } from '../utilities/positionHelpers';
import { mockLogger } from '../utilities/logger';
import { empty } from '../utilities/typeGuards';
import { IArgumentType, IFunctionType } from '../typeChecker/types/types';
import { KsFunction } from '../entities/function';
import { KsLock } from '../entities/lock';
import { KsVariable } from '../entities/variable';
import { KsParameter } from '../entities/parameters';
import { isKsFunction, isKsLock, isKsVariable, isKsParameter } from '../entities/entityHelpers';

export class ScopeManager implements GraphNode<ScopeManager> {
  public inScopes: Set<ScopeManager>;

  constructor(
    public readonly scopesRoot: IScopeNode,
    public readonly outScopes: Set<ScopeManager>,
    public readonly uri: string,
    public readonly logger: ILogger = mockLogger) {
    this.inScopes = new Set();

    for (const scope of outScopes) {
      scope.inScopes.add(this);
    }
  }

  // used for graph interface
  public get value(): ScopeManager {
    return this;
  }

  // get all adjacent nodes
  public get adjacentNodes(): GraphNode<ScopeManager>[] {
    return Array.from(this.outScopes);
  }

  // add a child scope manager from a file run in this file
  public addScope(scopeMan: ScopeManager): void {
    this.outScopes.add(scopeMan);
    scopeMan.inScopes.add(this);
  }

  // should be called when the associated file is closed
  public closeSelf(): void {
    // remove childern if no parents
    if (this.inScopes.size === 0) {
      // remove references from child scopes
      for (const child of this.outScopes) {
        child.inScopes.delete(this);
      }

      // clear own references
      this.outScopes.clear();
    }
  }

  // should be called when the associated file is deleted
  public removeSelf(): void {
    // remove refernces from parent scopes
    for (const parent of this.inScopes) {
      parent.outScopes.delete(this);
    }

    // remove references from child scopes
    for (const child of this.outScopes) {
      child.inScopes.delete(this);
    }

    // clear own references
    this.outScopes.clear();
    this.inScopes.clear();
  }

  // declare the type
  public declareType(
    range: Range, name: string,
    type: IArgumentType | IFunctionType,
    ...entities: EntityType[]): void {

    const tracker = this.scopedEntityTrackers(range.start, name, entities);
    if (!empty(tracker)) {
      tracker.declareType(type);
    }
  }

  // get the type
  public getType(
    range: Range, name: string,
    ...entities: EntityType[]): Maybe<IArgumentType | IFunctionType> {
    const tracker = this.scopedEntityTrackers(range.start, name, entities);
    if (!empty(tracker)) {
      return tracker.getType({ range, uri: this.uri });
    }

    return undefined;
  }

  // set the type
  public setType(
    range: Range, name: string,
    type: IArgumentType | IFunctionType): void {
    const trackers = this.scopedNamedTrackers(range.start, name);
    if (trackers.length === 0) {
      trackers[0].setType({ range, uri: this.uri }, type);
    }
  }

  private scopedEntityTrackers(
    pos: Position, name: string,
    entities: EntityType[]): Maybe<IKsEntityTracker<KsEntity>> {
    if (entities.length === 0) {
      const trackers = this.scopedNamedTrackers(pos, name);
      return trackers.length === 1 ? trackers[0] : undefined;
    }

    const trackers = this.scopedEntitiesTrackers(pos, name, entities);
    return trackers.length === 1 ? trackers[0] : undefined;
  }

  // get every entity in the file
  public fileEntities(): KsEntity[] {
    return Array.from(this.scopesRoot.scope.entities()).concat(
      this.fileEntitiesDepth(this.scopesRoot.children));
  }

  // get entity at a position
  public scopedEntity(pos: Position, name: string): Maybe<KsEntity> {
    const entities = this.scopedEntities(pos);
    return entities.find(entity => entity.name.lexeme === name);
  }

  // get all entities in scope at a position
  public scopedEntities(pos: Position): KsEntity[] {
    return this.scopedTrackers(pos)
      .map(tracker => tracker.declared.entity);
  }

  // get a global tracker
  public globalTrackers(name: string): IKsEntityTracker[] {
    return Array.from(this.scopesRoot.scope.values())
      .filter(tracker => tracker.declared.entity.name.lexeme === name);
  }

  // get function tracker at position
  public scopedFunctionTracker(pos: Position, name: string): Maybe<IKsEntityTracker<KsFunction>> {
    const trackers = this.scopedNamedTrackers(pos, name);
    const functionTrackers = trackers
      .filter(tracker => isKsFunction(tracker.declared.entity));

    if (functionTrackers.length === 1) {
      return functionTrackers[0] as IKsEntityTracker<KsFunction>;
    }

    return undefined;
  }

  // get lock tracker at position
  public scopedLockTracker(pos: Position, name: string): Maybe<IKsEntityTracker<KsLock>> {
    const trackers = this.scopedNamedTrackers(pos, name);
    const functionTrackers = trackers
      .filter(tracker => isKsLock(tracker.declared.entity));

    if (functionTrackers.length === 1) {
      return functionTrackers[0] as IKsEntityTracker<KsLock>;
    }

    return undefined;
  }

  // get lock tracker at position
  public scopedVariableTracker(pos: Position, name: string): Maybe<IKsEntityTracker<KsVariable>> {
    const trackers = this.scopedNamedTrackers(pos, name);
    const functionTrackers = trackers
      .filter(tracker => isKsVariable(tracker.declared.entity));

    if (functionTrackers.length === 1) {
      return functionTrackers[0] as IKsEntityTracker<KsVariable>;
    }

    return undefined;
  }

  // get lock tracker at position
  public scopedParameterTracker(pos: Position, name: string): Maybe<IKsEntityTracker<KsParameter>> {
    const trackers = this.scopedNamedTrackers(pos, name);
    const functionTrackers = trackers
      .filter(tracker => isKsParameter(tracker.declared.entity));

    if (functionTrackers.length === 1) {
      return functionTrackers[0] as IKsEntityTracker<KsParameter>;
    }

    return undefined;
  }

  // get tracker at a position
  public scopedEntitiesTrackers(
    pos: Position, name: string,
    entities: EntityType[]): IKsEntityTracker[] {

    const trackers = this.scopedNamedTrackers(pos, name);
    const functionTrackers = trackers
      .filter(tracker =>  entities.some(entity => tracker.declared.entity.tag === entity));

    if (functionTrackers.length === 1) {
      return functionTrackers as IKsEntityTracker[];
    }

    return [];
  }

  // get tracker at a position
  // TODO will probably need to be more complicated
  public scopedNamedTrackers(pos: Position, name: string): IKsEntityTracker[] {
    const trackers = this.scopedTrackers(pos);
    return trackers.filter(tracker => tracker.declared.entity.name.lexeme === name);
  }

  // get all entity trackers in scope at a position
  private scopedTrackers(pos: Position): IKsEntityTracker[] {
    const entities = Array.from(this.scopesRoot.scope.values()).concat(
      ...Array.from(this.outScopes.values())
        .map(scope => Array.from(scope.scopesRoot.scope.values())),
    );

    return this.scopedTrackersDepth(pos, this.scopesRoot.children)
      .concat(entities);
  }

  // recursively move down scopes for every entity
  private fileEntitiesDepth(nodes: IScopeNode[]): KsEntity[] {
    let entities: KsEntity[] = [];

    for (const node of nodes) {
      entities = entities.concat(
        Array.from(node.scope.entities()),
        this.fileEntitiesDepth(node.children));
    }

    return entities;
  }

  // recursively move down scopes for more relevant entities
  private scopedTrackersDepth(pos: Position, nodes: IScopeNode[]): IKsEntityTracker[] {
    let entities: IKsEntityTracker[] = [];

    for (const node of nodes) {
      const { position } = node;
      switch (position.tag) {
        // if global it is available
        case 'global':
          entities = entities.concat(
            Array.from(node.scope.values()),
            this.scopedTrackersDepth(pos, node.children));
          break;
        // if the scope has a real position check if we're in the bounds
        case 'real':
          const { start, end } = position;
          if (positionBeforeEqual(start, pos) && positionAfterEqual(end, pos)) {

            entities = entities.concat(
              Array.from(node.scope.values()),
              this.scopedTrackersDepth(pos, node.children));
          }
      }
    }

    return entities;
  }
}
