import { Graph } from './graph';

/**
 * Represents the strongly connected components of a graph
 */
export class StronglyConnectedComponent<T> {
  /**
   * Is the graph acyclic
   */
  public readonly acyclic: boolean;

  /**
   * A map from each node to it's component
   */
  public readonly nodeMap: Map<T, Set<T>>;

  /**
   * The strongly connected components of the graph
   */
  public readonly components: Set<T>[];

  /**
   * Construct a new strongly connected components
   * @param acyclic is the graph acyclic
   * @param nodeMap map from nodes to components
   * @param components the components in this graph
   */
  constructor(acyclic: boolean, nodeMap: Map<T, Set<T>>, components: Set<T>[]) {
    this.acyclic = acyclic;
    this.nodeMap = nodeMap;
    this.components = components;
  }

  /**
   * Create this from the result
   * @param graph the source graph
   * @param nodeMap node map to components
   */
  public static fromResult<T>(
    graph: Graph<T>,
    nodeMap: Map<T, Set<T>>,
    components: Set<T>[],
  ) {
    return new StronglyConnectedComponent(
      graph.nodes.size === components.length,
      nodeMap,
      components,
    );
  }
}
