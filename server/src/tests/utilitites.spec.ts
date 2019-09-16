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
import { dfsNode } from '../utilities/graphUtils';

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

class NumberNode implements GraphNode<number> {
  public readonly nodes: GraphNode<number>[];
  constructor(public readonly idx: number) {
    this.nodes = [];
  }

  value() {
    return this.idx;
  }
  adjacentNodes() {
    return this.nodes;
  }
}

const createLoop = (length: number) => {
  const nodes: NumberNode[] = [];

  for (let i = 0; i < length; i++) {
    nodes.push(new NumberNode(i));
  }

  for (let i = 0; i < length; i++) {
    nodes[i].nodes.push(nodes[(i + 1) % length]);
  }

  return nodes;
};

const createDisjoint = (length: number) => {
  const nodes: NumberNode[] = [];

  for (let i = 0; i < length; i++) {
    nodes.push(new NumberNode(i));
  }

  return nodes;
};

const createFullyConnected = (length: number) => {
  const nodes: NumberNode[] = [];

  for (let i = 0; i < length; i++) {
    nodes.push(new NumberNode(i));
  }

  for (let i = 0; i < length; i++) {
    for (let j = 0; j < length; j++) {
      nodes[i].nodes.push(nodes[j]);
    }
  }

  return nodes;
};

describe('when using a graph', () => {
  describe('when constructing a graph', () => {
    test('when constructing a graph from nodes', () => {
      const nodes = createLoop(10);
      const graph = Graph.fromNodes(nodes);

      expect(graph.nodes).toBe(nodes);

      for (const node of nodes) {
        // check that map goes correctly
        const id = graph.nodeMap.get(node);
        expect(id).toBeDefined();
        expect(graph.idMap.get(id!)).toBe(node);

        // check adjacent nodes are correct
        for (const adjacentNode of node.adjacentNodes()) {
          const adjacentId = graph.nodeMap.get(adjacentNode);
          expect(adjacentId).toBeDefined();
          expect(graph.edges[id!]).toContain(adjacentId);
        }
      }
    });
  });

  describe('when performing depth first search', () => {
    test('when all nodes are disjoint', () => {
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

    test('when nodes form a cycle', () => {
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
});

// describe('tree traverse', () => {
//   test('token check', () => {
//     const source = readFileSync(
//       '../../kerboscripts/unitTests/allLanguage.ks',
//       'utf-8',
//     );
//     const scanner = new Scanner(source, 'file://fake.ks');
//     const { tokens } = scanner.scanTokens();

//     const parser = new Parser('file:://fake.ks', tokens);
//     const { script } = parser.parse();

//     const tokenCheck = new TokenCheck();
//     tokenCheck.orderedTokens(script);

//     for (const statement of validStatements) {
//     }
//   });
// });
