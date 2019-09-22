import { empty, unWrap } from '../utilities/typeGuards';

/**
 * a class representing a graph
 */
export class Graph<T> {
  /**
   * the nodes within the graph
   */
  public readonly nodes: Set<T>;

  /**
   * The edges present within this graph
   */
  private edges: Map<T, Set<T>>;

  /**
   * The reverse of the edges present in the graph
   */
  private mirrorEdges: Map<T, Set<T>>;

  /**
   * Construct a new graph
   * @param nodes nodes in this graph
   */
  constructor(...nodes: T[]) {
    this.nodes = new Set(nodes);
    this.edges = new Map();
    this.mirrorEdges = new Map();

    for (const node of nodes) {
      this.addEdgeSets(node);
    }
  }

  /**
   * Add a node to this graph
   */
  public addNode(node: T): boolean {
    if (this.has(node)) {
      return false;
    }

    this.nodes.add(node);
    this.addEdgeSets(node);

    return true;
  }

  /**
   * Remove a node from this graph
   * @param node
   */
  public removeNode(node: T): boolean {
    if (!this.has(node)) {
      return false;
    }

    this.nodes.delete(node);
    this.removeEdgeSets(node);

    return true;
  }

  /**
   * Add a new edge between the two nodes
   * @param source the source node
   * @param sink the sink node
   */
  public addEdge(source: T, sink: T): boolean {
    // get normal and reverse
    const nodeEdges = this.edges.get(source);
    const nodeMirrorEdges = this.mirrorEdges.get(sink);

    // if either edges doesn't exists break out
    if (empty(nodeEdges) || empty(nodeMirrorEdges)) {
      return false;
    }

    // and edges to normal and reverse
    nodeEdges.add(sink);
    nodeMirrorEdges.add(source);

    return true;
  }

  /**
   * Remove an edge between two nodes
   * @param source the source node
   * @param sink the sink node
   */
  public removeEdge(source: T, sink: T): boolean {
    // get normal and reverse
    const nodeEdges = this.edges.get(source);
    const nodeMirrorEdges = this.mirrorEdges.get(sink);

    // if either edges doesn't exists break out
    if (empty(nodeEdges) || empty(nodeMirrorEdges)) {
      return false;
    }

    // remove edges from graph
    const nodeHas = nodeEdges.has(sink);
    const mirrorHas = nodeMirrorEdges.has(source);

    if (!(nodeHas && mirrorHas)) {
      return false;
    }

    nodeEdges.delete(sink);
    nodeMirrorEdges.delete(source);

    return true;
  }

  /**
   * Get the edges from this node
   * @param node node to retrieve edges
   */
  public getEdges(node: T): Maybe<Set<T>> {
    return this.edges.get(node);
  }

  /**
   * Mirror the graph with reversed edges
   */
  public mirror(): Graph<T> {
    const graph = new Graph(...this.nodes);

    graph.edges = new Map(this.mirrorEdges.entries());
    graph.mirrorEdges = new Map(this.edges.entries());

    return graph;
  }

  /**
   * Is this node is in the graph
   * @param node node to check
   */
  private has(node: T): boolean {
    return this.nodes.has(node);
  }

  /**
   * Add the sets for each edge map
   * @param node node to add sets
   */
  private addEdgeSets(node: T) {
    this.edges.set(node, new Set());
    this.mirrorEdges.set(node, new Set());
  }

  /**
   * Remove all edges associated with the node
   * @param node
   */
  private removeEdgeSets(node: T) {
    // get edges for the node normally and reverse
    const nodeEdges = unWrap(this.edges.get(node));
    const nodeMirrorEdges = unWrap(this.mirrorEdges.get(node));

    // delete the node edges from both collection
    this.edges.delete(node);
    this.mirrorEdges.delete(node);

    // delete edges going into node
    for (const edgeNode of nodeMirrorEdges) {
      unWrap(this.edges.get(edgeNode)).delete(node);
    }

    // delete edges leaving node in the mirror
    for (const edgeNode of nodeEdges) {
      unWrap(this.mirrorEdges.get(edgeNode)).delete(node);
    }
  }

  /**
   * Create a graph from a collection of nodes
   * @param nodes nodes to construct graph from
   */
  public static fromNodes<T>(nodes: GraphNode<T>[]): Graph<T> {
    const graph = new Graph(...nodes.map(node => node.value()));

    for (const sourceNode of nodes) {
      for (const targetNode of sourceNode.adjacentNodes()) {
        graph.addEdge(sourceNode.value(), targetNode.value());
      }
    }

    return graph;
  }
}
