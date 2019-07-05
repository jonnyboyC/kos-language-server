import { empty } from './typeGuards';

/**
 * Generate a mapping function using a provided map object
 * @param map the map to generate the function from
 * @param name the name of the mapping function
 */
export const mapper = <TKey, TValue>(map: Map<TKey, TValue>, name: string) =>
(key: TKey): TValue => {
  const value = map.get(key);
  if (empty(value)) {
    throw new Error(`No mapping for ${key} in ${name}`);
  }

  return value;
};
