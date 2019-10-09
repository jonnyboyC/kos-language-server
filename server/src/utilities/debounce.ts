import { empty } from './typeGuards';

/**
 * Debounce a function to execute after a call hasn't been made for timeout milliseconds
 * @param timeout timeout before the function is called
 * @param func function to call
 */
export function debounce(
  timeout: number,
  func: (...params: any[]) => void,
): () => void {
  let timeoutId: Maybe<NodeJS.Timeout> = undefined;
  let lastCall: number = 0;

  return () => {
    const now = Date.now();
    if (!empty(timeoutId) && now - lastCall < timeout) {
      clearTimeout(timeoutId);
    }

    lastCall = now;
    timeoutId = setTimeout(func, timeout);
  };
}
