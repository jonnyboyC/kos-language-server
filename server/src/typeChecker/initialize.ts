import { partInitializer } from './types/parts/initialize';
import { orbitalInitializer } from './types/orbital/initialize';
import { primitiveInitializer } from './types/primitives/initialize';

export const typeInitializer = () => {
  primitiveInitializer();
  orbitalInitializer();
  partInitializer();
};
