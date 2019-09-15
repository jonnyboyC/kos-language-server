import { Boundary } from './types';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { dfs } from '../utilities/graphUtils';
import { IStmt } from '../parser/types';
import { BasicBlock } from './models/basicBlock';
import { empty } from '../utilities/typeGuards';
import { rangeContains } from '../utilities/positionUtils';
import { createDiagnostic } from '../utilities/diagnosticsUtils';
import { Graph } from '../models/graph';

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
   * All the nodes in this script
   */
  public readonly nodes: BasicBlock[];

  /**
   * A graph of the whole flow
   */
  private readonly graph: Graph<BasicBlock>;

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
    nodes: BasicBlock[],
  ) {
    this.script = script;
    this.functions = functions;
    this.triggers = triggers;
    this.nodes = nodes;

    this.graph = Graph.fromNodes(nodes);
  }

  public reachable(): Diagnostic[] {
    const visited = new Array<boolean>(this.graph.nodes.length).fill(false);

    // find all reachable points from the script entrance
    dfs(this.graph, this.graph.toIdx(this.script.entry), visited);

    // check reachable blocks from each function
    for (const boundary of this.functions) {
      dfs(this.graph, this.graph.toIdx(boundary.entry), visited);
    }

    // check reachable blocks from each trigger
    for (const boundary of this.triggers) {
      dfs(this.graph, this.graph.toIdx(boundary.entry), visited);
    }

    const diagnostics: Diagnostic[] = [];
    let lastStmt: Maybe<IStmt> = undefined;

    // create diagnostics for regions that are unreachable
    for (const block of this.nodes) {
      if (!visited[this.graph.toIdx(block)]) {
        const { stmt } = block;

        if (
          empty(stmt) ||
          (!empty(lastStmt) && rangeContains(lastStmt, stmt))
        ) {
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
