import { IStack } from '../analysis/types';

/**
 * Perform depth first search for all reachable points from the provided root node
 * @param root root node
 */
export const dfs = <T>(root: GraphNode<T>): Set<GraphNode<T>> => {
  const stack: IStack<GraphNode<T>> = [];
  const explored = new Set<GraphNode<T>>();

  // initialize with root
  stack.push(root);
  explored.add(root);

  while (stack.length !== 0) {
    // pop a node off the stack
    const current = stack.pop()!;

    // check all adjacent nodes
    for (const node of current.adjacentNodes()) {
      // if we've already seen this node continue
      if (explored.has(node)) {
        continue;
      }

      // add to stack
      explored.add(node);
      stack.push(node);
    }
  }

  return explored;
};
