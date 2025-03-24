import { partInitializer } from './ksTypes/parts/initialize';
import { orbitalInitializer } from './ksTypes/orbital/initialize';
import { primitiveInitializer } from './ksTypes/primitives/initialize';
import { collectionInitializer } from './ksTypes/collections/initialize';
import { guiInitializer } from './ksTypes/gui/initialize';
import { timeInitializer } from './ksTypes/time/initalize';

export const typeInitializer = () => {
  primitiveInitializer();
  orbitalInitializer();
  partInitializer();
  collectionInitializer();
  guiInitializer();
  timeInitializer();
};
