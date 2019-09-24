import { Position, Range } from 'vscode-languageserver';
import {
  rangeEqual,
  positionAfter,
  positionBefore,
  positionEqual,
  positionAfterEqual,
  positionBeforeEqual,
  positionToString,
  rangeContainsPos,
  rangeIntersection,
  rangeBefore,
  rangeAfter,
  rangeToString,
  binaryLeft,
  binaryRight,
  binaryLeftKey,
  binaryRightKey,
} from '../utilities/positionUtils';
import { toCase } from '../utilities/stringUtils';
import { Logger } from '../models/logger';
import { Graph } from '../models/graph';
import { dfsNode, scc } from '../utilities/graphUtils';
import { empty } from '../utilities/typeGuards';

const createRange = (
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
): Range => {
  return {
    start: Position.create(startLine, startCharacter),
    end: Position.create(endLine, endCharacter),
  };
};

describe('position utils', () => {
  test('position utils', () => {
    const pos1: Position = {
      line: 5,
      character: 10,
    };

    const pos2: Position = {
      line: 5,
      character: 11,
    };

    const pos3: Position = {
      line: 4,
      character: 2,
    };

    const pos4: Position = {
      line: 4,
      character: 8,
    };

    // pos 1
    expect(positionEqual(pos1, pos1)).toBeTruthy();
    expect(positionAfterEqual(pos1, pos1)).toBeTruthy();
    expect(positionBeforeEqual(pos1, pos1)).toBeTruthy();
    expect(positionBefore(pos1, pos2)).toBeTruthy();
    expect(positionBeforeEqual(pos1, pos2)).toBeTruthy();
    expect(positionAfter(pos1, pos3)).toBeTruthy();
    expect(positionAfterEqual(pos1, pos3)).toBeTruthy();
    expect(positionAfter(pos1, pos4)).toBeTruthy();
    expect(positionAfterEqual(pos1, pos4)).toBeTruthy();

    // pos 2
    expect(positionEqual(pos2, pos2)).toBeTruthy();
    expect(positionAfterEqual(pos2, pos2)).toBeTruthy();
    expect(positionBeforeEqual(pos2, pos2)).toBeTruthy();
    expect(positionAfter(pos2, pos1)).toBeTruthy();
    expect(positionAfter(pos2, pos3)).toBeTruthy();
    expect(positionAfter(pos2, pos4)).toBeTruthy();

    // pos 3
    expect(positionEqual(pos3, pos3)).toBeTruthy();
    expect(positionAfterEqual(pos3, pos3)).toBeTruthy();
    expect(positionBeforeEqual(pos3, pos3)).toBeTruthy();
    expect(positionBefore(pos3, pos1)).toBeTruthy();
    expect(positionBefore(pos3, pos2)).toBeTruthy();
    expect(positionBefore(pos3, pos4)).toBeTruthy();

    // pos 4
    expect(positionEqual(pos4, pos4)).toBeTruthy();
    expect(positionAfterEqual(pos4, pos4)).toBeTruthy();
    expect(positionBeforeEqual(pos4, pos4)).toBeTruthy();
    expect(positionBefore(pos4, pos1)).toBeTruthy();
    expect(positionBefore(pos4, pos2)).toBeTruthy();
    expect(positionAfter(pos4, pos3)).toBeTruthy();

    expect(positionToString(pos1)).toBe('line: 6 character: 11');
  });

  test('ranger utils', () => {
    const range1: Range = {
      start: {
        line: 4,
        character: 2,
      },
      end: {
        line: 5,
        character: 18,
      },
    };

    const rangeWithin: Range = {
      start: {
        line: 5,
        character: 4,
      },
      end: {
        line: 5,
        character: 16,
      },
    };

    const rangeIntersect: Range = {
      start: {
        line: 4,
        character: 1,
      },
      end: {
        line: 4,
        character: 14,
      },
    };

    const rangeOther: Range = {
      start: {
        line: 4,
        character: 1,
      },
      end: {
        line: 4,
        character: 1,
      },
    };

    // pos 1
    expect(rangeEqual(range1, range1)).toBeTruthy();
    expect(rangeEqual(rangeWithin, rangeWithin)).toBeTruthy();
    expect(rangeEqual(rangeIntersect, rangeIntersect)).toBeTruthy();

    expect(rangeContainsPos(range1, rangeWithin.start)).toBeTruthy();
    expect(rangeContainsPos(range1, rangeWithin.end)).toBeTruthy();

    expect(rangeIntersection(range1, rangeIntersect)).toBeTruthy();
    expect(rangeIntersection(rangeIntersect, range1)).toBeTruthy();

    expect(rangeAfter(range1, { line: 3, character: 24 })).toBeTruthy();
    expect(rangeAfter(range1, { line: 4, character: 1 })).toBeTruthy();

    expect(rangeBefore(range1, { line: 5, character: 20 })).toBeTruthy();
    expect(rangeBefore(range1, { line: 6, character: 1 })).toBeTruthy();

    expect(rangeToString(range1)).toBe(
      'line: 5 character: 3 to line: 6 character: 19',
    );
    expect(rangeToString(rangeWithin)).toBe('line: 6 character: 5-17');
    expect(rangeToString(rangeIntersect)).toBe('line: 5 character: 2-15');
    expect(rangeToString(rangeOther)).toBe('line: 5 character: 2');
  });

  test('binary search utils', () => {
    const ranges: Range[] = [
      createRange(0, 0, 0, 5),
      createRange(0, 6, 0, 10),
      createRange(0, 11, 0, 15),
      createRange(0, 21, 0, 25),
      createRange(0, 26, 0, 30),
      createRange(0, 31, 0, 35),
    ];

    const unity = <T>(x: T) => x;

    const result11 = binaryLeft(ranges, Position.create(0, 1));
    const result12 = binaryLeftKey(ranges, Position.create(0, 1), unity);
    expect(result11).toBe(ranges[0]);
    expect(result12).toBe(ranges[0]);

    const result21 = binaryLeft(ranges, Position.create(0, 17));
    const result22 = binaryLeftKey(ranges, Position.create(0, 17), unity);
    expect(result21).toBe(ranges[2]);
    expect(result22).toBe(ranges[2]);

    const result31 = binaryLeft(ranges, Position.create(0, 26));
    const result32 = binaryLeftKey(ranges, Position.create(0, 26), unity);
    expect(result31).toBe(ranges[4]);
    expect(result32).toBe(ranges[4]);

    const result41 = binaryRight(ranges, Position.create(0, 1));
    const result42 = binaryRightKey(ranges, Position.create(0, 1), unity);
    expect(result41).toBe(ranges[0]);
    expect(result42).toBe(ranges[0]);

    const result51 = binaryRight(ranges, Position.create(0, 17));
    const result52 = binaryRightKey(ranges, Position.create(0, 17), unity);
    expect(result51).toBe(ranges[3]);
    expect(result52).toBe(ranges[3]);

    const result61 = binaryRight(ranges, Position.create(0, 26));
    const result62 = binaryRightKey(ranges, Position.create(0, 26), unity);
    expect(result61).toBe(ranges[4]);
    expect(result62).toBe(ranges[4]);
  });
});

describe('to case', () => {
  test('case changes', () => {
    expect(toCase(CaseKind.lowerCase, 'example')).toBe('example');
    expect(toCase(CaseKind.upperCase, 'example')).toBe('EXAMPLE');
    expect(toCase(CaseKind.pascalCase, 'example')).toBe('Example');
    expect(toCase(CaseKind.camelCase, 'example')).toBe('example');

    expect(toCase(CaseKind.lowerCase, 'EXAMPLE')).toBe('example');
    expect(toCase(CaseKind.upperCase, 'EXAMPLE')).toBe('EXAMPLE');
    expect(toCase(CaseKind.pascalCase, 'EXAMPLE')).toBe('Example');
    expect(toCase(CaseKind.camelCase, 'EXAMPLE')).toBe('example');

    expect(toCase(CaseKind.lowerCase, 'EXAMPLE', 'example')).toBe(
      'exampleexample',
    );
    expect(toCase(CaseKind.upperCase, 'EXAMPLE', 'example')).toBe(
      'EXAMPLEEXAMPLE',
    );
    expect(toCase(CaseKind.pascalCase, 'EXAMPLE', 'example')).toBe(
      'ExampleExample',
    );
    expect(toCase(CaseKind.camelCase, 'EXAMPLE', 'example')).toBe(
      'exampleExample',
    );
  });
});

describe('logger', () => {
  test('log level', () => {
    const mockBase = {
      lastLevel: LogLevel.verbose,
      lastMessage: '',
      log(message: string) {
        mockBase.lastLevel = LogLevel.log;
        mockBase.lastMessage = message;
      },
      info(message: string) {
        mockBase.lastLevel = LogLevel.info;
        mockBase.lastMessage = message;
      },
      warn(message: string) {
        mockBase.lastLevel = LogLevel.warn;
        mockBase.lastMessage = message;
      },
      error(message: string) {
        mockBase.lastLevel = LogLevel.error;
        mockBase.lastMessage = message;
      },
    };

    const logger = new Logger(mockBase, LogLevel.info);

    expect(logger.level).toBe(LogLevel.info);

    logger.info('info');
    expect(mockBase.lastLevel).toBe(LogLevel.info);
    expect(mockBase.lastMessage).toBe('info');

    logger.log('log');
    expect(mockBase.lastLevel).toBe(LogLevel.log);
    expect(mockBase.lastMessage).toBe('log');

    logger.warn('warn');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('warn');

    // TODO this is a temporary thing until we get the
    // errors in the type checker under control
    logger.error('error');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');

    // set logging off
    logger.level = LogLevel.none;
    logger.info('info');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');

    logger.log('log');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');

    logger.warn('warn');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');

    logger.error('error');
    expect(mockBase.lastLevel).toBe(LogLevel.warn);
    expect(mockBase.lastMessage).toBe('error');
  });
});

class Node implements GraphNode<Node> {
  public readonly nodes: GraphNode<Node>[];
  public id: number;
  constructor(id: number) {
    this.nodes = [];
    this.id = id;
  }

  value() {
    return this;
  }
  adjacentNodes() {
    return this.nodes;
  }
}

const createLoop = (length: number) => {
  const nodes: Node[] = [];

  for (let i = 0; i < length; i++) {
    nodes.push(new Node(i));
  }

  for (let i = 0; i < length; i++) {
    nodes[i].nodes.push(nodes[(i + 1) % length]);
  }

  return nodes;
};

const createDisjoint = (length: number) => {
  const nodes: Node[] = [];

  for (let i = 0; i < length; i++) {
    nodes.push(new Node(i));
  }

  return nodes;
};

const createFullyConnected = (length: number) => {
  const nodes: Node[] = [];

  for (let i = 0; i < length; i++) {
    nodes.push(new Node(i));
  }

  for (let i = 0; i < length; i++) {
    for (let j = 0; j < length; j++) {
      nodes[i].nodes.push(nodes[j]);
    }
  }

  return nodes;
};

const createDiamond = () => {
  const nodes: Node[] = [];

  for (let i = 0; i < 4; i++) {
    nodes.push(new Node(i));
  }

  nodes[0].nodes.push(nodes[1], nodes[2]);
  nodes[1].nodes.push(nodes[3]);
  nodes[2].nodes.push(nodes[3]);

  return nodes;
};

describe('when constructing a graph', () => {
  test('when constructing a graph from nodes', () => {
    const nodes = createLoop(10);
    const graph = Graph.fromNodes(nodes);

    for (const node of nodes) {
      // check that map goes correctly
      expect(graph.nodes.has(node)).toBe(true);
      expect(nodes).toContain(node);
      const edges = graph.getEdges(node);
      expect(edges).toBeDefined();

      // check adjacent nodes are correct
      for (const adjacentNode of node.adjacentNodes()) {
        expect(graph.nodes.has(adjacentNode.value())).toBe(true);
        expect(edges!.has(adjacentNode.value())).toBeDefined();
      }
    }
  });
});

describe('when mutating a graph', () => {
  let graph: Graph<Node>;

  beforeEach(() => {
    const nodes = createLoop(4);
    graph = Graph.fromNodes(nodes);
  });

  describe('when adding a node to the graph', () => {
    test('Does not add when it exists', () => {
      const [firstNode] = graph.nodes;
      expect(graph.addNode(firstNode)).toBe(false);
    });

    test("Does add when it doesn't exists", () => {
      const newNode = new Node(10);
      expect(graph.addNode(newNode)).toBe(true);
    });
  });

  describe('when removing a node from the graph', () => {
    test("Does nothing if it doesn't exists", () => {
      const newNode = new Node(10);
      expect(graph.removeNode(newNode)).toBe(false);
    });

    test('Removes nodes and associated edges if node exists', () => {
      const [firstNode] = graph.nodes;
      expect(graph.removeNode(firstNode)).toBe(true);
      expect(graph.nodes.has(firstNode)).toBe(false);

      for (const node of graph.nodes) {
        const edges = graph.getEdges(node);
        expect(edges).toBeDefined();
        expect(edges!.has(firstNode)).toBe(false);
      }
    });
  });

  describe('when adding a edge to the graph', () => {
    test('Does not add when either is node does not exist', () => {
      const [firstNode] = graph.nodes;
      const newNode = new Node(20);

      expect(graph.addEdge(firstNode, newNode)).toBe(false);
      expect(graph.addEdge(newNode, firstNode)).toBe(false);
    });

    test('Does add edge when both exists', () => {
      const [firstNode, secondNode] = graph.nodes;

      expect(graph.addEdge(firstNode, secondNode)).toBe(true);
      expect(graph.addEdge(secondNode, firstNode)).toBe(true);
    });
  });

  describe('when removing an edge from the graph', () => {
    test("Doesn't remove if node doesn't exist", () => {
      const newNode = new Node(10);
      const [firstNode] = graph.nodes;

      expect(graph.removeEdge(newNode, firstNode)).toBe(false);
    });

    test("Doesn't remove edge if doesn't exist", () => {
      const [firstNode, secondNode, thirdNode, fourthNode] = graph.nodes;

      expect(graph.removeEdge(firstNode, thirdNode)).toBe(false);
      expect(graph.removeEdge(secondNode, fourthNode)).toBe(false);
      expect(graph.removeEdge(thirdNode, firstNode)).toBe(false);
      expect(graph.removeEdge(fourthNode, secondNode)).toBe(false);
    });

    test('Removes edge if it exist', () => {
      const [firstNode, secondNode, thirdNode, fourthNode] = graph.nodes;

      expect(graph.removeEdge(firstNode, secondNode)).toBe(true);

      let edges = graph.getEdges(firstNode);
      expect(edges).toBeDefined();
      expect(edges!.size).toBe(0);

      expect(graph.removeEdge(secondNode, thirdNode)).toBe(true);

      edges = graph.getEdges(secondNode);
      expect(edges).toBeDefined();
      expect(edges!.size).toBe(0);

      expect(graph.removeEdge(thirdNode, fourthNode)).toBe(true);

      edges = graph.getEdges(thirdNode);
      expect(edges).toBeDefined();
      expect(edges!.size).toBe(0);

      expect(graph.removeEdge(fourthNode, firstNode)).toBe(true);

      edges = graph.getEdges(fourthNode);
      expect(edges).toBeDefined();
      expect(edges!.size).toBe(0);
    });
  });
});

describe('when performing depth first search on a graph', () => {
  test('throws when called with invalid args', () => {
    const nodes = createFullyConnected(10);
    const connected = Graph.fromNodes(nodes);

    const disjoint = new Node(20);

    // expect(() => dfs(connected, 11, new Array(10).fill(false))).toThrow();
    expect(() => dfsNode(connected, disjoint)).toThrow();
  });

  describe('for a disjoint graph', () => {
    test('discovers only one node is reachable', () => {
      const nodes = createDisjoint(10);
      const graph = Graph.fromNodes(nodes);

      for (const node of nodes) {
        const dfs = dfsNode(graph, node);

        // check we're reachable
        expect(dfs.reachable.size).toBe(1);
        expect(dfs.reachable.has(node)).toBe(true);

        // check all other are un reachable
        expect(dfs.unreachable.size).toBe(9);
        expect(dfs.unreachable.has(node)).toBe(false);
      }
    });
  });

  describe('for a single cycle graph', () => {
    test('discovers only one node is reachable', () => {
      const nodes = createLoop(10);
      const graph = Graph.fromNodes(nodes);

      for (const node of nodes) {
        const dfs = dfsNode(graph, node);

        // check we're reachable
        expect(dfs.reachable.size).toBe(10);
        for (const innerNode of nodes) {
          expect(dfs.reachable.has(innerNode)).toBe(true);
        }

        // check none are unreachable
        expect(dfs.unreachable.size).toBe(0);
      }
    });
  });

  test('when nodes are fully connected', () => {
    const nodes = createFullyConnected(10);
    const graph = Graph.fromNodes(nodes);

    for (const node of nodes) {
      const dfs = dfsNode(graph, node);

      // check we're reachable
      expect(dfs.reachable.size).toBe(10);
      for (const innerNode of nodes) {
        expect(dfs.reachable.has(innerNode)).toBe(true);
      }

      // check none are unreachable
      expect(dfs.unreachable.size).toBe(0);
    }
  });
});

describe('when mirroring a graph', () => {
  test('when all nodes are disjoint', () => {
    const nodes = createDisjoint(10);
    const graph = Graph.fromNodes(nodes);
    const graphPrime = graph.mirror();

    // check we're still disjoint
    for (const node of graphPrime.nodes) {
      const edges = graph.getEdges(node);
      expect(edges).toBeDefined();
      expect(edges!.size).toBe(0);
    }
  });

  test('when nodes form a cycle', () => {
    const nodes = createLoop(10);
    const graph = Graph.fromNodes(nodes);
    const graphPrime = graph.mirror();

    for (let i = 0; i < 10; i++) {
      const node = nodes[i];
      const adjacentNode = nodes[(i + 9) % 10];

      expect(graphPrime.nodes.has(node)).toBeDefined();
      expect(graphPrime.nodes.has(adjacentNode)).toBeDefined();

      const edges = graphPrime.getEdges(node);
      expect(edges).toBeDefined();
      expect(edges!.size).toBe(1);

      expect(edges!.has(adjacentNode)).toBe(true);
    }
  });

  test('when nodes are fully connected', () => {
    const nodes = createFullyConnected(10);
    const graph = Graph.fromNodes(nodes);
    const graphPrime = graph.mirror();

    for (const node of graphPrime.nodes) {
      const edges = graphPrime.getEdges(node);
      expect(edges).toBeDefined();

      if (!empty(edges)) {
        expect(edges.size).toBe(10);

        for (const node of graphPrime.nodes) {
          expect(edges.has(node)).toBe(true);
        }
      }
    }
  });
});

describe('when determining strongly connected components of a graph', () => {
  test('when all nodes are disjoint', () => {
    const nodes = createDisjoint(10);
    const graph = Graph.fromNodes(nodes);
    const sccResult = scc(graph);

    expect(sccResult.acyclic).toBe(true);

    // check we're still disjoint
    for (const [node, component] of sccResult.nodeMap) {
      expect(component.has(node)).toBe(true);
      expect(component.size).toBe(1);
    }
  });

  test('when nodes form a cycle', () => {
    const nodes = createLoop(10);
    const graph = Graph.fromNodes(nodes);
    const sccResult = scc(graph);

    expect(sccResult.acyclic).toBe(false);

    // check we're in the same component disjoint
    for (const [, component] of sccResult.nodeMap) {
      for (const graphNode of nodes) {
        expect(component.has(graphNode)).toBe(true);
      }

      expect(component.size).toBe(10);
    }
  });

  test('when nodes form a diamond', () => {
    const nodes = createDiamond();
    const graph = Graph.fromNodes(nodes);
    const sccResult = scc(graph);

    expect(sccResult.acyclic).toBe(true);
  });
});
