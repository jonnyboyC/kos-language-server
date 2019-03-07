import { IScopeNode,
  KsEntity, GraphNode, IKsEntityTracker, EntityType,
} from './types';
import { Position, Range } from 'vscode-languageserver';
import { rangeContains } from '../utilities/positionHelpers';
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

    const tracker = this.scopedEntityTracker(range.start, name, entities);
    if (!empty(tracker)) {
      tracker.declareType(type);
    }
  }

  // get the type
  public getType(
    range: Range, name: string,
    ...entities: EntityType[]): Maybe<IArgumentType | IFunctionType> {
    const tracker = this.scopedEntityTracker(range.start, name, entities);
    if (!empty(tracker)) {
      return tracker.getType({ range, uri: this.uri });
    }

    return undefined;
  }

  // set the type
  public setType(
    range: Range, name: string,
    type: IArgumentType | IFunctionType): void {
    const tracker = this.scopedNamedTracker(range.start, name);
    if (!empty(tracker)) {
      tracker.setType({ range, uri: this.uri }, type);
    }
  }

  // get every entity in the file
  public fileEntities(): KsEntity[] {
    return Array.from(this.scopesRoot.scope.entities()).concat(
      this.fileEntitiesDepth(this.scopesRoot.children));
  }

  // get a global tracker
  public globalTrackers(name: string): IKsEntityTracker[] {
    return Array.from(this.scopesRoot.scope.values())
      .filter(tracker => tracker.declared.entity.name.lexeme === name);
  }

  // get function tracker at position
  public scopedFunctionTracker(pos: Position, name: string): Maybe<IKsEntityTracker<KsFunction>> {
    const tracker = this.scopedNamedTracker(
      pos, name, tracker => isKsFunction(tracker.declared.entity));

    if (!empty(tracker)) {
      return tracker as IKsEntityTracker<KsFunction>;
    }

    return undefined;
  }

  // get lock tracker at position
  public scopedLockTracker(pos: Position, name: string): Maybe<IKsEntityTracker<KsLock>> {
    const tracker = this.scopedNamedTracker(
      pos, name, trackers => isKsLock(trackers.declared.entity));

    if (!empty(tracker)) {
      return tracker as IKsEntityTracker<KsLock>;
    }

    return undefined;
  }

  // get lock tracker at position
  public scopedVariableTracker(pos: Position, name: string): Maybe<IKsEntityTracker<KsVariable>> {
    const tracker = this.scopedNamedTracker(
      pos, name, trackers => isKsVariable(trackers.declared.entity));

    if (!empty(tracker)) {
      return tracker as IKsEntityTracker<KsVariable>;
    }

    return undefined;
  }

  // get lock tracker at position
  public scopedParameterTracker(pos: Position, name: string): Maybe<IKsEntityTracker<KsParameter>> {
    const tracker = this.scopedNamedTracker(
      pos, name, tracker => isKsParameter(tracker.declared.entity));

    if (!empty(tracker)) {
      return tracker as IKsEntityTracker<KsParameter>;
    }

    return undefined;
  }

  public scopedEntities(pos: Position): KsEntity[] {
    return this.scopedTrackers(pos)
      .map(tracker => tracker.declared.entity);
  }

  // get tracker at a position
  public scopedEntityTracker(
    pos: Position, name: string,
    entityTypes: EntityType[]): Maybe<IKsEntityTracker> {

    const filters: ((entity: KsEntity) => boolean)[] = [];
    for (const entityType of entityTypes) {
      switch (entityType)
      {
        case EntityType.function:
          filters.push(isKsFunction);
          break;
        case EntityType.parameter:
          filters.push(isKsParameter);
          break;
        case EntityType.lock:
          filters.push(isKsLock);
          break;
        case EntityType.variable:
          filters.push(isKsVariable);
          break;
        default:
          throw new Error('Unexpected entity');
      }
    }

    const tracker = this.scopedNamedTracker(
      pos, name, tracker =>  filters.some(filter => filter(tracker.declared.entity)));

    return tracker;
  }

  // get tracker at a position
  public scopedNamedTracker(
    pos: Position,
    name: string,
    entityFilter?: (x: IKsEntityTracker) => boolean): Maybe<IKsEntityTracker> {

    const baseFilter = (trackers: IKsEntityTracker) =>
      trackers.declared.entity.name.lexeme === name;

    const finalFilter = empty(entityFilter)
      ? baseFilter
      : (trackers: IKsEntityTracker) => baseFilter(trackers) && entityFilter(trackers);

    return this.scopedTracker(pos, finalFilter);
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

  // get all entity trackers in scope at a position
  private scopedTrackers(pos: Position): IKsEntityTracker[] {
    const scoped = this.scopedTrackersDepth(pos, this.scopesRoot.children);
    const fileGlobal = Array.from(this.scopesRoot.scope.values());
    const importedGlobals = Array.from(this.outScopes.values())
      .map(scope => Array.from(scope.scopesRoot.scope.values()));

    return scoped.concat(
      fileGlobal,
      ...importedGlobals);
  }

  // get all entity trackers in scope at a position
  private scopedTracker(
    pos: Position,
    trackerFilter: (x: IKsEntityTracker) => boolean = _ => true): Maybe<IKsEntityTracker> {

    const scoped = this.scopedTrackerDepth(pos, this.scopesRoot.children, trackerFilter);
    if (!empty(scoped)) {
      return scoped;
    }

    const fileGlobal = Array.from(this.scopesRoot.scope.values());
    const importedGlobals = Array.from(this.outScopes.values())
      .map(scope => Array.from(scope.scopesRoot.scope.values()));

    const [match] = fileGlobal.concat(...importedGlobals)
      .filter(trackerFilter);

    return match;
  }

  // recursively move down scopes for more relevant entities
  private scopedTrackersDepth(
    pos: Position,
    nodes: IScopeNode[]) : IKsEntityTracker[] {

    for (const node of nodes) {
      const { position } = node;
      switch (position.tag) {
        // if global it is available
        case 'global':
          return this.scopedTrackersDepth(pos, node.children)
            .concat(Array.from(node.scope.values()));
        // if the scope has a real position check if we're in the bounds
        case 'real':
          if (rangeContains(position, pos)) {
            return this.scopedTrackersDepth(pos, node.children)
              .concat(Array.from(node.scope.values()));
          }
          break;
      }
    }

    return [];
  }

  // recursively move down scopes for more relevant entities
  private scopedTrackerDepth(
    pos: Position,
    nodes: IScopeNode[],
    trackerFilter: (x: IKsEntityTracker) => boolean) : Maybe<IKsEntityTracker> {
    let childEntity: Maybe<IKsEntityTracker> = undefined;

    for (const node of nodes) {
      const { position } = node;
      switch (position.tag) {
        // if global it is available
        case 'global':
          childEntity = this.scopedTrackerDepth(pos, node.children, trackerFilter);
          if (!empty(childEntity)) {
            return childEntity;
          }

          const currentEntities = Array.from(node.scope.values()).filter(trackerFilter);
          if (currentEntities.length === 1) {
            return currentEntities[0];
          }
          break;
        // if the scope has a real position check if we're in the bounds
        case 'real':
          if (rangeContains(position, pos)) {
            childEntity = this.scopedTrackerDepth(pos, node.children, trackerFilter);
            if (!empty(childEntity)) {
              return childEntity;
            }

            const currentEntities = Array.from(node.scope.values()).filter(trackerFilter);
            if (currentEntities.length === 1) {
              return currentEntities[0];
            }
          }
          break;
      }
    }

    return undefined;
  }
}
