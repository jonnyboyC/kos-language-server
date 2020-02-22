import { FoldableService } from '../../src/services/foldableService';
import { FoldingRange } from 'vscode-languageserver';
import { parseSource, noParseErrors } from '../utilities/setup';

// #region string scripts
const regionFold = `
// #region

// #endregion
`;

const blockFold = `
if true {

}

function example {
  print "hi".
}
`;

const callFold = `
local l is list(
  "cat",
  "dog",
  "ship"
).
`;

const allFold = `
// #region
if true {
  local l is list(
    "cat",
    "dog",
    "ship"
  ).
}

function example {
  print "hi".
}
// #endregion
`;
// #endregion

describe('foldableService', () => {
  describe('when a set of regions tags are present', () => {
    test('identifies a fold region', () => {
      debugger;
      const result = parseSource(regionFold);
      noParseErrors(result);
      const { region, endRegion } = result.directives.directives;

      const service = new FoldableService();
      const foldable = service.findRegions(result.parse.script, [
        ...region,
        ...endRegion,
      ]);

      expect(foldable).toEqual([{
        startCharacter: 0,
        startLine: 1,
        endCharacter: 13,
        endLine: 3,
        kind: 'region',
      }]);
    });
  });

  describe('when a call is present', () => {
    test('identifies the fold region', () => {
      const result = parseSource(callFold);
      noParseErrors(result);

      const { region, endRegion } = result.directives.directives;

      const service = new FoldableService();
      const foldable = service.findRegions(result.parse.script, [
        ...region,
        ...endRegion,
      ]);

      expect(foldable).toHaveLength(1);

      expect(foldable).toEqual([{
        startCharacter: 15,
        startLine: 1,
        endCharacter: 1,
        endLine: 5,
        kind: 'region',
      }]);
    });
  });

  describe('when a blocks is present', () => {
    test('identifies the fold regions', () => {
      const result = parseSource(blockFold);
      noParseErrors(result);

      const { region, endRegion } = result.directives.directives;

      const service = new FoldableService();
      const foldable = service.findRegions(result.parse.script, [
        ...region,
        ...endRegion,
      ]);

      expect(foldable).toHaveLength(2);
      const folds: FoldingRange[] = [
        {
          startCharacter: 8,
          startLine: 1,
          endCharacter: 1,
          endLine: 3,
          kind: 'region',
        },
        {
          startCharacter: 17,
          startLine: 5,
          endCharacter: 1,
          endLine: 7,
          kind: 'region',
        },
      ];

      expect(foldable).toContainEqual(folds[0]);
      expect(foldable).toContainEqual(folds[1]);
    });
  });

  test('Fold both', () => {
    const result = parseSource(allFold);
    noParseErrors(result);

    const { region, endRegion } = result.directives.directives;

    const service = new FoldableService();
    const foldable = service.findRegions(result.parse.script, [
      ...region,
      ...endRegion,
    ]);

    expect(foldable).toHaveLength(4);
    const folds: FoldingRange[] = [
      {
        startCharacter: 8,
        startLine: 2,
        endCharacter: 1,
        endLine: 8,
        kind: 'region',
      },
      {
        startCharacter: 17,
        startLine: 3,
        endCharacter: 3,
        endLine: 7,
        kind: 'region',
      },
      {
        startCharacter: 17,
        startLine: 10,
        endCharacter: 1,
        endLine: 12,
        kind: 'region',
      },
      {
        startCharacter: 0,
        startLine: 1,
        endCharacter: 13,
        endLine: 13,
        kind: 'region',
      },
    ];

    expect(foldable).toContainEqual(folds[0]);
    expect(foldable).toContainEqual(folds[1]);
    expect(foldable).toContainEqual(folds[2]);
    expect(foldable).toContainEqual(folds[3]);
  });
});
