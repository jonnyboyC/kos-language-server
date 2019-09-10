import { Boundary } from './types';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { dfs } from '../utilities/graphUtils';
import { IStmt } from '../parser/types';
import { BasicBlock } from './basicBlock';
import { empty } from '../utilities/typeGuards';
import { rangeContains } from '../utilities/positionUtils';
import { createDiagnostic } from '../utilities/diagnosticsUtils';

/**
 * A class representing the control flow graph through a script.
 */
export class FlowGraph {
  /**
   * entrance and exit blocks to the script
   */
  public readonly script: Boundary;

  /**
   * entrance and exit blocks to each function in the script
   */
  public readonly functions: Boundary[];

  /**
   * entrance and exit blocks to each trigger in the script
   */
  public readonly triggers: Boundary[];

  /**
   * Map from each statement to it's basic block
   */
  private readonly stmtBlocks: Map<IStmt, BasicBlock>;

  /**
   * construct a new flow graph
   * @param script script boundary
   * @param functions function boundaries
   * @param triggers trigger boundaries
   */
  constructor(
    script: Boundary,
    functions: Boundary[],
    triggers: Boundary[],
    stmtBlocks: Map<IStmt, BasicBlock>,
  ) {
    this.script = script;
    this.functions = functions;
    this.triggers = triggers;
    this.stmtBlocks = stmtBlocks;
  }

  public reachable(): Diagnostic[] {
    // find all reachable points from the script entrance
    const reachableBlock = dfs(this.script.entry);

    // check reachable blocks from each function
    for (const entry of this.functions.map(func => func.entry)) {
      for (const block of dfs(entry)) {
        reachableBlock.add(block);
      }
    }

    // check reachable blocks from each trigger
    for (const entry of this.triggers.map(trigger => trigger.entry)) {
      for (const block of dfs(entry)) {
        reachableBlock.add(block);
      }
    }

    const diagnostics: Diagnostic[] = [];
    let lastStmt: Maybe<IStmt> = undefined;

    // create diagnostics for regions that are unreachable
    for (const [stmt, block] of this.stmtBlocks) {
      if (!reachableBlock.has(block)) {
        if (!empty(lastStmt) && rangeContains(lastStmt, stmt)) {
          continue;
        }

        diagnostics.push(
          createDiagnostic(
            stmt,
            'Unreachable code',
            DiagnosticSeverity.Information,
          ),
        );
        lastStmt = stmt;
      }
    }

    // return diagnostics
    return diagnostics;
  }
}
