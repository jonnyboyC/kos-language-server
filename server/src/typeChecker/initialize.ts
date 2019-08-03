import { partInitializer } from './types/parts/initialize';
import { orbitalInitializer } from './types/orbital/initialize';
import { primitiveInitializer } from './types/primitives/initialize';
import { collectionInitializer } from './types/collections/initialize';

export const typeInitializer = () => {
  primitiveInitializer();
  orbitalInitializer();
  partInitializer();
  collectionInitializer();
};
