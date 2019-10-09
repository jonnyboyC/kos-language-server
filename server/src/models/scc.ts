import { Graph } from './graph';
import { empty } from '../utilities/typeGuards';

/**
 * Represents the strongly connected components of a graph
 */
export class StronglyConnectedComponent<T> {
  /**
   * Is the graph acyclic
   */
  public readonly acyclic: boolean;

  /**
   * Original graph
   */
  public readonly graph: Graph<T>;

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
  constructor(graph: Graph<T>, nodeMap: Map<T, Set<T>>, components: Set<T>[]) {
    this.graph = graph;
    this.acyclic = graph.nodes.size === components.length;
    this.nodeMap = nodeMap;
    this.components = components;
  }

  /**
   * Create a graph from the strongly connected components
   */
  public componentGraph(): Graph<Set<T>> {
    const sccGraph = new Graph(...this.components);

    for (const component of this.components) {
      for (const node of component) {
        const edges = this.graph.getEdges(node);
        if (empty(edges)) {
          continue;
        }

        for (const edge of edges) {
          const sink = this.nodeMap.get(edge);
          if (!component.has(edge) && !empty(sink)) {
            sccGraph.addEdge(component, sink);
          }
        }
      }
    }

    return sccGraph;
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
    return new StronglyConnectedComponent(graph, nodeMap, components);
  }
}
