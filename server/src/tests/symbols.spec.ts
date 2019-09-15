import { URI } from 'vscode-uri';
import { TextDocument } from 'vscode-languageserver';
import { createMockDocumentService } from './utilities/mockServices';
import { AnalysisService } from '../services/analysisService';
import { mockLogger, mockTracer } from '../models/logger';
import { empty } from '../utilities/typeGuards';
import { SearchState } from '../analysis/types';

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

    const docService = createMockDocumentService(
      documents,
      URI.file('/').toString(),
    );

    const analysisService = new AnalysisService(
      CaseKind.camelCase,
      mockLogger,
      mockTracer,
      docService,
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
        grandInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        grandInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeUndefined();
      expect(
        grandInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        grandInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeUndefined();
      expect(
        grandInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();

      expect(
        greatUncleInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeUndefined();
      expect(
        greatUncleInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        greatUncleInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        greatUncleInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        greatUncleInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();

      expect(
        parentInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        parentInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        parentInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        parentInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        parentInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();

      expect(
        uncleInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeUndefined();
      expect(
        uncleInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        uncleInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        uncleInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        uncleInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();

      expect(
        childInfo.symbolTable.globalEnvironment(
          'grandparent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        childInfo.symbolTable.globalEnvironment(
          'greatuncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        childInfo.symbolTable.globalEnvironment(
          'parent',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        childInfo.symbolTable.globalEnvironment(
          'uncle',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
      expect(
        childInfo.symbolTable.globalEnvironment(
          'child',
          SearchState.dependents,
          new Set(),
        ),
      ).toBeDefined();
    }
  });
});
