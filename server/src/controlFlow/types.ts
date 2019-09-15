import { BasicBlock } from './basicBlock';

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

  /**
   * A fake entrance to an unreachable block
   */
  unreachableEntry,
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

export const enum ReachableJumps {
  /**
   * Both branches of a jump are reachable
   */
  both,

  /**
   * Only the true branch is reachable
   */
  true,

  /**
   * Only the false branch is reachable
   */
  false,
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
