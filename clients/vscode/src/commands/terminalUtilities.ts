import { window, Terminal } from 'vscode';

/**
 * Check if any terminals are open
 */
export const isTerminalOpen = (): boolean => {
  return window.terminals.length > 0;
};

/**
 * Create or select a terminal with the provided name
 * @param name name of the terminal to select
 */
export const selectOrCreateTerminal = (name: string): Terminal => {
  // if we don't have any terimals create and return
  if (!isTerminalOpen()) {
    return window.createTerminal(name);
  }

  // search for our terminal
  for (const terminal of window.terminals) {
    if (terminal.name === name) {
      return terminal;
    }
  }

  // if not found create
  return window.createTerminal(name);
};
