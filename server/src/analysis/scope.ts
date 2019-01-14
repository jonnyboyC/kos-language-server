import { IKsEntityTracker, IScope, KsEntity } from './types';

export class Scope extends Map<string, IKsEntityTracker> implements IScope {
  constructor() {
    super();
  }

  public entities(): KsEntity[] {
    const entities: KsEntity[] = [];

    for (const trackers of this.values()) {
      entities.push(trackers.declared.entity);
    }

    return entities;
  }
}
