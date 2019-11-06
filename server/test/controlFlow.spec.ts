import { Tokenized } from '../src/scanner/types';
import { Ast } from '../src/parser/types';
import { Scanner } from '../src/scanner/scanner';
import { Parser } from '../src/parser/parser';
import { ControlFlow } from '../src/controlFlow/controlFlow';
import { Marker } from '../src/scanner/models/marker';
import { zip } from '../src/utilities/arrayUtils';
import { DiagnosticSeverity, Range } from 'vscode-languageserver';
import { join } from 'path';
import { readFileSync } from 'fs';
import { FlowGraph } from '../src/controlFlow/flowGraph';

const fakeUri = 'C:\\fake.ks';

interface IFlowResults {
  scan: Tokenized;
  parse: Ast;
  flow?: FlowGraph;
}

// parse source
const parseSource = (source: string): Pick<IFlowResults, 'scan' | 'parse'> => {
  const scanner = new Scanner(source, fakeUri);
  const scan = scanner.scanTokens();

  const parser = new Parser(fakeUri, scan.tokens);
  const parse = parser.parse();

  return { scan, parse };
};

const checkFlow = (source: string): IFlowResults => {
  const result = parseSource(source);

  const controlFlow = new ControlFlow(result.parse.script);
  const flow = controlFlow.flow();

  return {
    ...result,
    flow,
  };
};

const noParseErrors = (result: IFlowResults): void => {
  expect(result.scan.scanDiagnostics.map(e => e.message)).toEqual([]);
  expect(result.parse.parseDiagnostics.map(e => e.message)).toEqual([]);
};

const noErrors = (result: IFlowResults): void => {
  expect(result.scan.scanDiagnostics.map(e => e.message)).toEqual([]);
  expect(result.parse.parseDiagnostics.map(e => e.message)).toEqual([]);
  expect(result.flow).toBeDefined();
  expect(result.flow!.reachable().map(e => e.message)).toEqual([]);
};

const postReturnSource = `
function example {
  return.
  print("post").
}

local b is true.
on b {
  return true.
  print("post").
}

when true = false then {
  return true.
  {
    print("post").
  }
}

local x is {
  return.
  print("post").
}.

local y is ({
  return.
  print("post").
}).
`;

const postBreakSource = `
for i in list(1, 2, 3) {
  if true {
    break.
    print(i).
  }
  break.
  print(i).
}

until false {
  break.
  print(i).
}

from { local x is 0. } until x > 10 step { set x to x + 1. } do {
  break.
  print(i).
}

local x is ({
  for i in range(10) {
    break.
    print(i).
  }
}).
`;

describe('Unreachable code', () => {
  const returnLocations: Range[] = [
    { start: new Marker(3, 2), end: new Marker(3, 15) },
    { start: new Marker(9, 2), end: new Marker(9, 15) },
    { start: new Marker(14, 2), end: new Marker(16, 3) },
    { start: new Marker(21, 2), end: new Marker(21, 15) },
    { start: new Marker(26, 2), end: new Marker(26, 15) },
  ];

  test('post return', () => {
    const result = checkFlow(postReturnSource);
    noParseErrors(result);

    const { flow } = result;
    expect(flow).toBeDefined();

    const flowDiagnostics = flow!.reachable();
    expect(flowDiagnostics).toHaveLength(returnLocations.length);
    for (const [diagnostic, location] of zip(
      flowDiagnostics,
      returnLocations,
    )) {
      expect(diagnostic.severity).toBe(DiagnosticSeverity.Information);
      expect(diagnostic.range.start).toEqual(location.start);
      expect(diagnostic.range.end).toEqual(location.end);
    }
  });

  const breakLocations: Range[] = [
    { start: new Marker(4, 4), end: new Marker(4, 12) },
    { start: new Marker(7, 2), end: new Marker(7, 10) },
    { start: new Marker(12, 2), end: new Marker(12, 10) },
    { start: new Marker(15, 41), end: new Marker(15, 60) },
    { start: new Marker(17, 2), end: new Marker(17, 10) },
    { start: new Marker(23, 4), end: new Marker(23, 12) },
  ];

  test('post break', () => {
    const result = checkFlow(postBreakSource);
    noParseErrors(result);

    const { flow } = result;
    expect(flow).toBeDefined();

    const flowDiagnostics = flow!
      .reachable()
      .sort((a, b) => a.range.start.line - b.range.start.line);

    expect(flowDiagnostics).toHaveLength(breakLocations.length);
    for (const [diagnostic, location] of zip(flowDiagnostics, breakLocations)) {
      expect(diagnostic.severity).toBe(DiagnosticSeverity.Information);
      expect(diagnostic.range.start).toEqual(location.start);
      expect(diagnostic.range.end).toEqual(location.end);
    }
  });

  test('all language', () => {
    const allNodePath = join(
      __dirname,
      '../../kerboscripts/parser_valid/unitTests/allLanguage.ks',
    );

    const allNodeSource = readFileSync(allNodePath, 'utf8');
    const result = checkFlow(allNodeSource);
    noErrors(result);
  });
});
