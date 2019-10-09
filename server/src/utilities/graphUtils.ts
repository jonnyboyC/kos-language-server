import { IStack } from '../analysis/types';
import { unWrap } from './typeGuards';
import { Graph } from '../models/graph';
import { StronglyConnectedComponent } from '../models/scc';

function fillOrder<T>(
  graph: Graph<T>,
  node: T,
  visited: Set<T>,
  stack: IStack<T>,
): void {
  visited.add(node);

  for (const edge of unWrap(graph.getEdges(node))) {
    if (!visited.has(edge)) {
      fillOrder(graph, edge, visited, stack);
    }
  }

  stack.push(node);
}

/**
 * Search the graph for strongly connected components. A strongly connected
 * component is a set of nodes that are reachable from all members of the component
 * @param graph graph to search for components
 */
export function scc<T>(graph: Graph<T>): StronglyConnectedComponent<T> {
  const stack: IStack<T> = [];
  const visited: Set<T> = new Set();

  for (const node of graph.nodes) {
    if (!visited.has(node)) {
      fillOrder(graph, node, visited, stack);
    }
  }

  const reverse = graph.transpose();
  visited.clear();

  const nodeMap = new Map<T, Set<T>>();
  const components: Set<T>[] = [];

  // # Now process all vertices in order defined by Stack
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (!visited.has(current)) {
      const component = new Set<T>();
      dfs(reverse, current, visited, (node: T) => {
        component.add(node);
        nodeMap.set(node, component);
        return false;
      });

      components.push(component);
    }
  }

  return StronglyConnectedComponent.fromResult(graph, nodeMap, components);
}

/**
 * Perform depth first search on the provided graph
 * @param graph The graph to transpose
 * @param root root node to inspect
 */
export function dfsNode<T>(graph: Graph<T>, root: T): Dfs<T> {
  if (!graph.nodes.has(root)) {
    throw new Error('Root not in this graph');
  }

  const visited: Set<T> = new Set();
  dfs(graph, root, visited);

  const reachable = new Set<T>();
  const unreachable = new Set<T>();

  // determine reachable and unreachable nodes
  for (const node of graph.nodes) {
    if (visited.has(node)) {
      reachable.add(node);
    } else {
      unreachable.add(node);
    }
  }

  return { reachable, unreachable };
}

/**
 * Perform depth first search on the provided graph. Updated the passed
 * visited array with visited nodes
 * @param graph graph
 * @param root index of the node to start from
 * @param visited visited nodes
 * @param whenVisited a function called when a node is visited.
 */
export function dfs<T>(
  graph: Graph<T>,
  root: T,
  visited: Set<T>,
  whenVisited: (node: T) => Maybe<boolean> = (_: T) => false,
): void {
  const stack: IStack<T> = [];

  // initialize with root
  stack.push(root);
  visited.add(root);

  // check if we should exit early
  if (whenVisited(root)) {
    return;
  }

  while (stack.length !== 0) {
    // pop a node off the stack
    const current = stack.pop()!;

    // check all adjacent nodes
    for (const node of unWrap(graph.getEdges(current))) {
      // if we've already seen this node continue
      if (visited.has(node)) {
        continue;
      }

      // add to stack
      visited.add(node);
      stack.push(node);

      // check if we should exit early
      if (whenVisited(node)) {
        return;
      }
    }
  }
}
