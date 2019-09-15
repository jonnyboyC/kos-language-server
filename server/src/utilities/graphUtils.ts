import { IStack } from '../analysis/types';
import { empty } from './typeGuards';
import { Graph } from '../models/graph';

/**
 * Transpose the graph to reverse the edges
 * @param graph The graph to transpose
 */
export function transpose<T>(graph: Graph<T>): Graph<T> {
  const edges: number[][] = [];
  for (let i = 0; i < graph.nodes.length; i += 1) {
    edges.push([]);
  }

  for (let i = 0; i < graph.nodes.length; i += 1) {
    for (const j of graph.edges[i]) {
      edges[j].push(i);
    }
  }

  return new Graph(graph.nodes, edges, graph.nodeMap, graph.idMap);
}

function fillOrder<T>(
  graph: Graph<T>,
  idx: number,
  visited: boolean[],
  stack: IStack<number>,
): void {
  visited[idx] = true;

  for (const edge of graph.edges[idx]) {
    if (!visited[edge]) {
      fillOrder(graph, edge, visited, stack);
    }
  }

  stack.push(idx);
}

export function stronglyConnected<T>(graph: Graph<T>): any {
  const stack: IStack<number> = [];
  const visited: boolean[] = new Array(graph.nodes.length).fill(false);

  for (let i = 0; i < graph.nodes.length; i++) {
    visited.push(false);
  }

  for (let i = 0; i < graph.nodes.length; i++) {
    if (!visited[i]) {
      fillOrder(graph, i, visited, stack);
    }
  }

  const reverse = transpose(graph);
  for (let i = 0; i < graph.nodes.length; i++) {
    visited[i] = false;
  }

  // # Now process all vertices in order defined by Stack
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (!visited[current]) {
      dfs(reverse, current, visited);
    }
  }
}

/**
 * Perform depth first search on the provided graph
 * @param graph The graph to transpose
 * @param root root node to inspect
 */
export function dfsNode<T>(graph: Graph<T>, root: GraphNode<T>): Dfs<T> {
  const rootId = graph.nodeMap.get(root);
  if (empty(rootId)) {
    throw new Error('Root not in this graph');
  }

  const visited: boolean[] = new Array(graph.nodes.length).fill(false);
  dfs(graph, rootId, visited);

  const reachable = new Set<GraphNode<T>>();
  const unreachable = new Set<GraphNode<T>>();

  // determine reachable and unreachable nodes
  for (let i = 0; i < graph.nodes.length; i++) {
    if (visited[i]) {
      reachable.add(graph.nodes[i]);
    } else {
      unreachable.add(graph.nodes[i]);
    }
  }

  return { reachable, unreachable };
}

export function dfs<T>(graph: Graph<T>, idx: number, visited: boolean[]): void {
  const stack: IStack<number> = [];

  // initialize with root
  stack.push(idx);
  visited[idx] = true;

  while (stack.length !== 0) {
    // pop a node off the stack
    const current = stack.pop()!;

    // check all adjacent nodes
    for (const node of graph.edges[current]) {
      // if we've already seen this node continue
      if (visited[node]) {
        continue;
      }

      // add to stack
      visited[node] = true;
      stack.push(node);
    }
  }
}
