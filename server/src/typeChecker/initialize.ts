import { partInitializer } from './ksTypes/parts/initialize';
import { orbitalInitializer } from './ksTypes/orbital/initialize';
import { primitiveInitializer } from './ksTypes/primitives/initialize';
import { collectionInitializer } from './ksTypes/collections/initialize';
import { guiInitializer } from './ksTypes/gui/initialize';

export const typeInitializer = () => {
  primitiveInitializer();
  orbitalInitializer();
  partInitializer();
  collectionInitializer();
  guiInitializer();
};
