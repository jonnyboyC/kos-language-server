import { empty } from '../utilities/typeGuards';

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
