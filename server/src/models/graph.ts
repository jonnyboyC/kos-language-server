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
  private outEdges: Map<T, Set<T>>;

  /**
   * The reverse of the edges present in the graph
   */
  private inEdges: Map<T, Set<T>>;

  /**
   * Construct a new graph
   * @param nodes nodes in this graph
   */
  constructor(...nodes: T[]) {
    this.nodes = new Set(nodes);
    this.outEdges = new Map();
    this.inEdges = new Map();

    for (const node of nodes) {
      this.initEdges(node);
    }
  }

  /**
   * Add a node to this graph
   */
  public addNode(node: T): boolean {
    if (this.hasNode(node)) {
      return false;
    }

    this.nodes.add(node);
    this.initEdges(node);

    return true;
  }

  /**
   * Remove a node from this graph
   * @param node
   */
  public removeNode(node: T): boolean {
    if (!this.hasNode(node)) {
      return false;
    }

    this.nodes.delete(node);
    this.removeNodeEdges(node);

    return true;
  }

  /**
   * How many nodes are in the graph
   */
  public nodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Is this node is in the graph
   * @param node node to check
   */
  public hasNode(node: T): boolean {
    return this.nodes.has(node);
  }

  /**
   * What are nodes that act as sources in this graph
   */
  public sources(): T[] {
    const sourceNodes: T[] = [];

    for (const node of this.nodes) {
      const inEdges = this.inEdges.get(node);
      if (!empty(inEdges) && inEdges.size === 0) {
        sourceNodes.push(node);
      }
    }

    return sourceNodes;
  }

  /**
   * What are nodes that act as sources in this graph
   */
  public sinks(): T[] {
    const sinkNodes: T[] = [];

    for (const node of this.nodes) {
      const outEdges = this.outEdges.get(node);
      if (!empty(outEdges) && outEdges.size === 0) {
        sinkNodes.push(node);
      }
    }

    return sinkNodes;
  }

  /**
   * Add a new edge between the two nodes
   * @param source the source node
   * @param sink the sink node
   */
  public addEdge(source: T, sink: T): boolean {
    // get normal and reverse
    const nodeEdges = this.outEdges.get(source);
    const nodeMirrorEdges = this.inEdges.get(sink);

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
    const nodeEdges = this.outEdges.get(source);
    const nodeMirrorEdges = this.inEdges.get(sink);

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
    return this.outEdges.get(node);
  }

  /**
   * Mirror the graph with reversed edges
   */
  public transpose(): Graph<T> {
    const graph = new Graph(...this.nodes);

    graph.outEdges = new Map(this.inEdges.entries());
    graph.inEdges = new Map(this.outEdges.entries());

    return graph;
  }

  /**
   * Add the sets for each edge map
   * @param node node to initialize edges
   */
  private initEdges(node: T) {
    this.outEdges.set(node, new Set());
    this.inEdges.set(node, new Set());
  }

  /**
   * Remove all edges associated with the node
   * @param node node to remove edges to
   */
  private removeNodeEdges(node: T) {
    // get edges for the node normally and reverse
    const nodeEdges = unWrap(this.outEdges.get(node));
    const nodeMirrorEdges = unWrap(this.inEdges.get(node));

    // delete the node edges from both collection
    this.outEdges.delete(node);
    this.inEdges.delete(node);

    // delete edges going into node
    for (const edgeNode of nodeMirrorEdges) {
      unWrap(this.outEdges.get(edgeNode)).delete(node);
    }

    // delete edges leaving node in the mirror
    for (const edgeNode of nodeEdges) {
      unWrap(this.inEdges.get(edgeNode)).delete(node);
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
