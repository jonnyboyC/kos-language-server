import { BasicBlock } from './basicBlock';
import { Diagnostic } from 'vscode-languageserver';

/**
 * Block kinds for basic blocks
 */
export const enum BlockKind {
  /**
   * The entrance to a script
   */
  scriptEntry,

  /**
   * The exit of a script
   */
  scriptExit,

  /**
   * The standard basic block
   */
  basic,

  /**
   * The entrance to an unknown block, either a function or trigger
   */
  unknownEntry,

  /**
   * The exit to an unknown block, either a function or trigger
   */
  unknownExit,
}

/**
 * Current return context
 */
export const enum ReturnContext {
  /**
   * The return context a function
   */
  function,

  /**
   * THe return context is a trigger
   */
  trigger,
}

/**
 * Indicates the boundary of a region with entrance and exit blocks
 */
export interface Boundary {
  /**
   * entry block into this boundary
   */
  entry: BasicBlock;

  /**
   * exit block of this boundary
   */
  exit: BasicBlock;
}

/**
 * A control flow result
 */
export interface Flow {
  /**
   * Entry point into the script
   */
  scriptEntry: BasicBlock;

  /**
   * Diagnostics for the control flow
   */
  flowDiagnostics: Diagnostic[];
}
