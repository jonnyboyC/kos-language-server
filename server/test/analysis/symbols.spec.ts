import { URI } from 'vscode-uri';
import { TextDocument } from 'vscode-languageserver';
import { createMockDocumentService } from '../utilities/mockServices';
import { AnalysisService } from '../../src/services/analysisService';
import { mockLogger, mockTracer } from '../../src/models/logger';
import { empty } from '../../src/utilities/typeGuards';
import { SearchState } from '../../src/analysis/types';
import { ResolverService } from '../../src/services/resolverService';

const grandSource = `
runOncePath("parent.ks").
global grandParent is "grandparent".
`;

const greatUncleSource = `
runOncePath("parent.ks").
runOncePath("uncle.ks").
global greatUncle is "great uncle".
`;

const parentSource = `
runOncePath("child.ks").
global parent is "parent".
`;

const uncleSource = `
global uncle is "uncle".
`;

const childSource = `
global child is "child".
`;

describe('Symbol Table', () => {
  test('Global Environment', async () => {
    const grandUri = URI.file('/example/folder/grandParent.ks').toString();
    const greatUncleUri = URI.file('/example/folder/greatUncle.ks').toString();
    const parentUri = URI.file('/example/folder/parent.ks').toString();
    const uncleUri = URI.file('/example/folder/uncle.ks').toString();
    const childUri = URI.file('/example/folder/child.ks').toString();

    const documents = new Map([
      [grandUri, TextDocument.create(grandUri, 'kos', 1.0, grandSource)],
      [
        greatUncleUri,
        TextDocument.create(greatUncleUri, 'kos', 1.0, greatUncleSource),
      ],
      [parentUri, TextDocument.create(parentUri, 'kos', 1.0, parentSource)],
      [uncleUri, TextDocument.create(uncleUri, 'kos', 1.0, uncleSource)],
      [childUri, TextDocument.create(childUri, 'kos', 1.0, childSource)],
    ]);

    const docService = createMockDocumentService(documents);
    const resolverService = new ResolverService(URI.file('/').toString());

    const analysisService = new AnalysisService(
      CaseKind.camelCase,
      mockLogger,
      mockTracer,
      docService,
      resolverService,
    );

    const grandInfo = await analysisService.getInfo(grandUri);
    const greatUncleInfo = await analysisService.getInfo(greatUncleUri);
    const parentInfo = await analysisService.getInfo(parentUri);
    const uncleInfo = await analysisService.getInfo(uncleUri);
    const childInfo = await analysisService.getInfo(childUri);

    expect(grandInfo).toBeDefined();
    expect(greatUncleInfo).toBeDefined();
    expect(parentInfo).toBeDefined();
    expect(uncleInfo).toBeDefined();
    expect(childInfo).toBeDefined();

    if (
      !empty(grandInfo) &&
      !empty(greatUncleInfo) &&
      !empty(parentInfo) &&
      !empty(uncleInfo) &&
      !empty(childInfo)
    ) {
      expect(
        grandInfo.semanticInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        grandInfo.semanticInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeUndefined();
      expect(
        grandInfo.semanticInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        grandInfo.semanticInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeUndefined();
      expect(
        grandInfo.semanticInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();

      expect(
        greatUncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeUndefined();
      expect(
        greatUncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        greatUncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        greatUncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        greatUncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();

      expect(parentInfo.semanticInfo.symbolTable.dependentTables).toContain(
        grandInfo.semanticInfo.symbolTable,
      );
      expect(
        parentInfo.semanticInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        parentInfo.semanticInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        parentInfo.semanticInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        parentInfo.semanticInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        parentInfo.semanticInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();

      expect(
        uncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeUndefined();
      expect(
        uncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        uncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        uncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        uncleInfo.semanticInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();

      expect(
        childInfo.semanticInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        childInfo.semanticInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        childInfo.semanticInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        childInfo.semanticInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        childInfo.semanticInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
    }
  });
});
