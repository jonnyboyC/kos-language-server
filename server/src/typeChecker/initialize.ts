import { partInitializer } from './ksTypes/parts/initialize';
import { orbitalInitializer } from './ksTypes/orbital/initialize';
import { primitiveInitializer } from './ksTypes/primitives/initialize';
import { collectionInitializer } from './ksTypes/collections/initialize';

export const typeInitializer = () => {
  primitiveInitializer();
  orbitalInitializer();
  partInitializer();
  collectionInitializer();
};
