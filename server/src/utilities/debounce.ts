import { empty } from './typeGuards';

/**
 * Debounce a function to execute after a call hasn't been made for timeout milliseconds
 * @param timeout timeout before the function is called
 * @param func function to call
 */
export function debounce<T extends (...params: any[]) => void>(
  timeout: number,
  func: T,
): (...args: Parameters<T>) => void {
  let timeoutId: Maybe<NodeJS.Timeout> = undefined;
  let lastCall: number = 0;

  return (...args: Parameters<typeof func>) => {
    const now = Date.now();
    if (!empty(timeoutId) && now - lastCall < timeout) {
      clearTimeout(timeoutId);
    }

    lastCall = now;
    timeoutId = setTimeout(func, timeout, ...args);
  };
}
