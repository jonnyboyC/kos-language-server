import { URI } from 'vscode-uri';
import { TextDocument } from 'vscode-languageserver';
import { createMockDocumentService } from './utilities/mockServices';
import { AnalysisService } from '../services/analysisService';
import { mockLogger, mockTracer } from '../utilities/logger';
import { empty } from '../utilities/typeGuards';

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
      CaseKind.camelcase,
      mockLogger,
      mockTracer,
      docService,
    );

    const grandInfo = await analysisService.getInfo(grandUri);
    const greatUncleInfo = await analysisService.getInfo(greatUncleUri);
    const parentInfo = await analysisService.getInfo(parentUri);
    const uncleInfo = await analysisService.getInfo(uncleUri);
    const childInfo = await analysisService.getInfo(childUri);

    expect(grandInfo).not.toBeUndefined();
    expect(greatUncleInfo).not.toBeUndefined();
    expect(parentInfo).not.toBeUndefined();
    expect(uncleInfo).not.toBeUndefined();
    expect(childInfo).not.toBeUndefined();

    if (
      !empty(grandInfo) &&
      !empty(greatUncleInfo) &&
      !empty(parentInfo) &&
      !empty(uncleInfo) &&
      !empty(childInfo)
    ) {
      expect(
        grandInfo.symbolTable.globalEnvironment('grandparent'),
      ).not.toBeUndefined();
      expect(
        grandInfo.symbolTable.globalEnvironment('greatuncle'),
      ).toBeUndefined();
      expect(
        grandInfo.symbolTable.globalEnvironment('parent'),
      ).not.toBeUndefined();
      expect(grandInfo.symbolTable.globalEnvironment('uncle')).toBeUndefined();
      expect(
        grandInfo.symbolTable.globalEnvironment('child'),
      ).not.toBeUndefined();

      expect(
        greatUncleInfo.symbolTable.globalEnvironment('grandparent'),
      ).toBeUndefined();
      expect(
        greatUncleInfo.symbolTable.globalEnvironment('greatuncle'),
      ).not.toBeUndefined();
      expect(
        greatUncleInfo.symbolTable.globalEnvironment('parent'),
      ).not.toBeUndefined();
      expect(
        greatUncleInfo.symbolTable.globalEnvironment('uncle'),
      ).not.toBeUndefined();
      expect(
        greatUncleInfo.symbolTable.globalEnvironment('child'),
      ).not.toBeUndefined();

      expect(
        parentInfo.symbolTable.globalEnvironment('grandparent'),
      ).not.toBeUndefined();
      expect(
        parentInfo.symbolTable.globalEnvironment('greatuncle'),
      ).not.toBeUndefined();
      expect(
        parentInfo.symbolTable.globalEnvironment('parent'),
      ).not.toBeUndefined();
      expect(
        parentInfo.symbolTable.globalEnvironment('uncle'),
      ).not.toBeUndefined();
      expect(
        parentInfo.symbolTable.globalEnvironment('child'),
      ).not.toBeUndefined();

      expect(
        uncleInfo.symbolTable.globalEnvironment('grandparent'),
      ).toBeUndefined();
      expect(
        uncleInfo.symbolTable.globalEnvironment('greatuncle'),
      ).not.toBeUndefined();
      expect(
        uncleInfo.symbolTable.globalEnvironment('parent'),
      ).not.toBeUndefined();
      expect(
        uncleInfo.symbolTable.globalEnvironment('uncle'),
      ).not.toBeUndefined();
      expect(
        uncleInfo.symbolTable.globalEnvironment('child'),
      ).not.toBeUndefined();

      expect(
        childInfo.symbolTable.globalEnvironment('grandparent'),
      ).not.toBeUndefined();
      expect(
        childInfo.symbolTable.globalEnvironment('greatuncle'),
      ).not.toBeUndefined();
      expect(
        childInfo.symbolTable.globalEnvironment('parent'),
      ).not.toBeUndefined();
      expect(
        childInfo.symbolTable.globalEnvironment('uncle'),
      ).not.toBeUndefined();
      expect(
        childInfo.symbolTable.globalEnvironment('child'),
      ).not.toBeUndefined();
    }
  });
});
