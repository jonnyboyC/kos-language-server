import { IStack } from '../analysis/types';
import { empty } from './typeGuards';

/**
 * a class representing a graph
 */
export class Graph<T> {
  /**
   * the nodes within the graph
   */
  public readonly nodes: GraphNode<T>[];

  /**
   * The edges present within this graph
   */
  public readonly edges: number[][];

  /**
   * A map from nodes to indices
   */
  public readonly nodeMap: Map<GraphNode<T>, number>;

  /**
   * A map from id to nodes
   */
  public readonly idMap: Map<number, GraphNode<T>>;

  /**
   * Construct a new graph
   * @param nodes nodes in this graph
   * @param edges edges in this graph
   * @param nodeMap a map from nodes to ids
   * @param idMap a map from ids to nodes
   */
  constructor(
    nodes: GraphNode<T>[],
    edges: number[][],
    nodeMap: Map<GraphNode<T>, number>,
    idMap: Map<number, GraphNode<T>>,
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.nodeMap = nodeMap;
    this.idMap = idMap;
  }

  /**
   * Get an index from a node
   * @param node node to retrieve index for
   */
  public toIdx(node: GraphNode<T>) {
    const idx = this.nodeMap.get(node);
    if (!empty(idx)) {
      return idx;
    }

    throw new Error('Node not present in graph.');
  }

  /**
   * Get a node from an index
   * @param idx index to retrieve node for
   */
  public toNode(idx: number) {
    const node = this.idMap.get(idx);
    if (!empty(node)) {
      return node;
    }

    throw new Error('Index not present in graph.');
  }

  /**
   * Create a graph from a collection of nodes
   * @param nodes nodes to construct graph from
   */
  public static fromNodes<T>(nodes: GraphNode<T>[]): Graph<T> {
    const nodeMap = new Map<GraphNode<T>, number>();
    const idMap = new Map<number, GraphNode<T>>();
    for (let i = 0; i < nodes.length; i++) {
      nodeMap.set(nodes[i], i);
      idMap.set(i, nodes[i]);
    }

    const edges: number[][] = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      const nodeAdjacent: number[] = [];
      edges[i] = nodeAdjacent;

      for (const adjacent of node.adjacentNodes()) {
        const idx = nodeMap.get(adjacent);
        if (empty(idx)) {
          throw new Error('Unknown graph node');
        }

        nodeAdjacent.push(idx);
      }
    }

    return new Graph(nodes, edges, nodeMap, idMap);
  }
}

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
