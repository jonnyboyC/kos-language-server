import { URI } from 'vscode-uri';
import { TextDocument } from 'vscode-languageserver';
import {
  createMockDocumentService,
  createMockDocConnection,
} from '../utilities/mockServices';
import { ResolverService } from '../../src/services/resolverService';
import { AnalysisService } from '../../src/services/analysisService';
import { mockLogger, mockTracer } from '../../src/models/logger';
import { empty } from '../../src/utilities/typeGuards';
import { IoService } from '../../src/services/IoService';
import { DocumentService } from '../../src/services/documentService';
import { join } from 'path';
import { DocumentInfo, DiagnosticUri } from '../../src/types';
import { typeInitializer } from '../../src/typeChecker/initialize';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');
const analysisDir = join(testDir, 'unitTests/analysis');
typeInitializer();

const documentInfoDiagnostics = ({
  lexicalInfo,
  semanticInfo,
  dependencyInfo,
}: DocumentInfo): DiagnosticUri[] => [
  ...lexicalInfo.diagnostics,
  ...semanticInfo.diagnostics,
  ...dependencyInfo.diagnostics,
];

describe('analysis service', () => {
  test('validate single document', async () => {
    const uri = URI.file('/example/folder/example.ks').toString();

    const documents = new Map([
      [uri, TextDocument.create(uri, 'kos', 1.0, 'print(10).')],
    ]);
    const docService = createMockDocumentService(documents);
    const resolverService = new ResolverService(uri);

    const analysisService = new AnalysisService(
      CaseKind.camelCase,
      mockLogger,
      mockTracer,
      docService,
      resolverService,
    );

    const diagnostics = await analysisService.analyzeDocument(
      uri,
      (documents.get(uri) as TextDocument).getText(),
    );
    const documentInfo = await analysisService.getInfo(uri);

    expect(diagnostics).toHaveLength(0);
    expect(documentInfo).toBeDefined();

    if (!empty(documentInfo)) {
      const { lexicalInfo, semanticInfo } = documentInfo;

      expect(semanticInfo.symbolTable.dependencyTables.size).toBe(2);
      expect(documentInfoDiagnostics(documentInfo)).toStrictEqual(diagnostics);
      expect(lexicalInfo.script.stmts).toHaveLength(1);
      expect(
        semanticInfo.symbolTable.rootScope.environment.symbols.length,
      ).toBe(0);
    }
  });

  test('validate single document getinfo first', async () => {
    const uri = URI.file('/example/folder/example.ks').toString();

    const documents = new Map([
      [uri, TextDocument.create(uri, 'kos', 1.0, 'print(10).')],
    ]);
    const docService = createMockDocumentService(documents);
    const resolverService = new ResolverService(uri);

    const analysisService = new AnalysisService(
      CaseKind.camelCase,
      mockLogger,
      mockTracer,
      docService,
      resolverService,
    );

    const documentInfo = await analysisService.getInfo(uri);

    expect(documentInfo).toBeDefined();

    if (!empty(documentInfo)) {
      const { lexicalInfo, semanticInfo } = documentInfo;

      expect(semanticInfo.symbolTable.dependencyTables.size).toBe(2);
      expect(lexicalInfo.script.stmts).toHaveLength(1);
      expect(
        semanticInfo.symbolTable.rootScope.environment.symbols.length,
      ).toBe(0);
    }

    const diagnostics = await analysisService.analyzeDocument(
      uri,
      (documents.get(uri) as TextDocument).getText(),
    );
    expect(diagnostics).toHaveLength(0);

    if (!empty(documentInfo)) {
      const { lexicalInfo, semanticInfo } = documentInfo;

      expect(semanticInfo.symbolTable.dependencyTables.size).toBe(0);
      expect(semanticInfo.diagnostics).toStrictEqual(diagnostics);
      expect(lexicalInfo.script.stmts).toHaveLength(1);
      expect(
        semanticInfo.symbolTable.rootScope.environment.symbols.length,
      ).toBe(0);
    }
  });

  test('set case', async () => {
    const uri = URI.file('/example/folder/example.ks').toString();

    const documents = new Map([
      [uri, TextDocument.create(uri, 'kos', 1.0, 'print(10).')],
    ]);
    const docService = createMockDocumentService(documents);
    const resolverService = new ResolverService(uri);

    const analysisService = new AnalysisService(
      CaseKind.lowerCase,
      mockLogger,
      mockTracer,
      docService,
      resolverService,
    );

    let bodyLib = analysisService['bodyLibrary'];
    let stdLib = analysisService['bodyLibrary'];

    for (const bodySymbol of bodyLib.allSymbols()) {
      expect(bodySymbol.name.lexeme).toBe(bodySymbol.name.lexeme.toLowerCase());
    }

    for (const stdSymbol of stdLib.allSymbols()) {
      expect(stdSymbol.name.lexeme).toBe(stdSymbol.name.lexeme.toLowerCase());
    }

    analysisService.setCase(CaseKind.upperCase);

    bodyLib = analysisService['bodyLibrary'];
    stdLib = analysisService['bodyLibrary'];

    for (const bodySymbol of bodyLib.allSymbols()) {
      expect(bodySymbol.name.lexeme).toBe(bodySymbol.name.lexeme.toUpperCase());
    }

    for (const stdSymbol of stdLib.allSymbols()) {
      expect(stdSymbol.name.lexeme).toBe(stdSymbol.name.lexeme.toUpperCase());
    }
  });

  test('validate multiple documents', async () => {
    const uri1 = URI.file('/example/folder/example1.ks').toString();
    const uri2 = URI.file('/example/folder/example2.ks').toString();
    const baseUri = URI.file('/example/folder').toString();

    const documents = new Map([
      [
        uri1,
        TextDocument.create(
          uri1,
          'kos',
          1.0,
          'runOncePath("example2.ks"). hi().',
        ),
      ],
      [
        uri2,
        TextDocument.create(uri2, 'kos', 1.0, 'function hi { print("hi"). }'),
      ],
    ]);
    const docService = createMockDocumentService(documents);
    const resolverService = new ResolverService(baseUri);

    const analysisService = new AnalysisService(
      CaseKind.camelCase,
      mockLogger,
      mockTracer,
      docService,
      resolverService,
    );

    const diagnostics = await analysisService.analyzeDocument(
      uri1,
      (documents.get(uri1) as TextDocument).getText(),
    );
    const documentInfo1 = await analysisService.getInfo(uri1);
    const documentInfo2 = await analysisService.getInfo(uri2);

    expect(diagnostics).toHaveLength(0);
    expect(documentInfo1).toBeDefined();
    expect(documentInfo2).toBeDefined();

    if (!empty(documentInfo1) && !empty(documentInfo2)) {
      expect(documentInfo1.semanticInfo.symbolTable.dependencyTables.size).toBe(
        3,
      );
      expect(documentInfo2.semanticInfo.symbolTable.dependencyTables.size).toBe(
        2,
      );
      expect(documentInfo1.semanticInfo.symbolTable.dependencyTables).toContain(
        documentInfo2.semanticInfo.symbolTable,
      );

      expect(documentInfoDiagnostics(documentInfo1)).toStrictEqual(diagnostics);
      expect(documentInfo1.lexicalInfo.script.stmts).toHaveLength(2);
      expect(documentInfo2.lexicalInfo.script.stmts).toHaveLength(1);
      expect(
        documentInfo1.semanticInfo.symbolTable.rootScope.environment.symbols()
          .length,
      ).toBe(0);

      expect(
        documentInfo2.semanticInfo.symbolTable.rootScope.environment.symbols()
          .length,
      ).toBe(1);
    }
  });

  test('validate multiple with updates documents', async () => {
    const uri1 = URI.file('/example/folder/example1.ks').toString();
    const uri2 = URI.file('/example/folder/example2.ks').toString();
    const baseUri = URI.file('/example/folder').toString();

    const documents = new Map([
      [
        uri1,
        TextDocument.create(
          uri1,
          'kos',
          1.0,
          'runOncePath("example2.ks"). hi().',
        ),
      ],
      [
        uri2,
        TextDocument.create(uri2, 'kos', 1.0, 'function hi { print("hi"). }'),
      ],
    ]);
    const docService = createMockDocumentService(documents);
    const resolverService = new ResolverService(baseUri);

    const analysisService = new AnalysisService(
      CaseKind.camelCase,
      mockLogger,
      mockTracer,
      docService,
      resolverService,
    );

    // initial load of example1.ks
    const diagnostics11 = await analysisService.analyzeDocument(
      uri1,
      (documents.get(uri1) as TextDocument).getText(),
    );
    const documentInfo11 = await analysisService.getInfo(uri1);

    // load from client example2.ks
    const diagnostics21 = await analysisService.analyzeDocument(
      uri2,
      (documents.get(uri2) as TextDocument).getText(),
    );
    const documentInfo21 = await analysisService.getInfo(uri2);

    // update load of example1.ks
    const diagnostics12 = await analysisService.analyzeDocument(
      uri1,
      (documents.get(uri1) as TextDocument).getText(),
    );
    const documentInfo12 = await analysisService.getInfo(uri1);

    // update load of example2.ks
    const diagnostics22 = await analysisService.analyzeDocument(
      uri2,
      (documents.get(uri2) as TextDocument).getText(),
    );
    const documentInfo22 = await analysisService.getInfo(uri2);

    expect(diagnostics11).toHaveLength(0);
    expect(diagnostics12).toHaveLength(0);
    expect(diagnostics21).toHaveLength(0);
    expect(diagnostics22).toHaveLength(0);

    expect(documentInfo11).toBeDefined();
    expect(documentInfo12).toBeDefined();
    expect(documentInfo21).toBeDefined();
    expect(documentInfo22).toBeDefined();

    if (!empty(documentInfo11) && !empty(documentInfo21)) {
      expect(
        documentInfo11.semanticInfo.symbolTable.dependencyTables.size,
      ).toBe(0);
      expect(documentInfo11.semanticInfo.symbolTable.dependentTables.size).toBe(
        0,
      );
      expect(
        documentInfo21.semanticInfo.symbolTable.dependencyTables.size,
      ).toBe(0);
      expect(documentInfo21.semanticInfo.symbolTable.dependentTables.size).toBe(
        0,
      );

      expect(documentInfoDiagnostics(documentInfo11)).toStrictEqual(
        diagnostics11,
      );
      expect(documentInfoDiagnostics(documentInfo11)).toStrictEqual(
        diagnostics12,
      );
      expect(documentInfoDiagnostics(documentInfo21)).toStrictEqual(
        diagnostics21,
      );
      expect(documentInfoDiagnostics(documentInfo21)).toStrictEqual(
        diagnostics22,
      );

      expect(analysisService['getDocumentInfo'](uri1)).not.toStrictEqual(
        documentInfo11,
      );
      expect(analysisService['getDocumentInfo'](uri2)).not.toStrictEqual(
        documentInfo21,
      );
    }

    if (!empty(documentInfo12) && !empty(documentInfo22)) {
      expect(
        documentInfo12.semanticInfo.symbolTable.dependencyTables.size,
      ).toBe(3);
      expect(documentInfo12.semanticInfo.symbolTable.dependentTables.size).toBe(
        0,
      );
      expect(
        documentInfo22.semanticInfo.symbolTable.dependencyTables.size,
      ).toBe(2);
      expect(documentInfo22.semanticInfo.symbolTable.dependentTables.size).toBe(
        1,
      );

      expect(analysisService['getDocumentInfo'](uri1)).toStrictEqual(
        documentInfo12,
      );
      expect(analysisService['getDocumentInfo'](uri2)).toStrictEqual(
        documentInfo22,
      );
    }
  });

  test('load directory', async () => {
    const connection = createMockDocConnection();
    const ioService = new IoService();
    const docService = new DocumentService(
      connection,
      ioService,
      mockLogger,
      mockTracer,
      URI.file(analysisDir),
    );
    const resolverService = new ResolverService(
      URI.file(analysisDir).toString(),
    );

    const analysisService = new AnalysisService(
      CaseKind.camelCase,
      mockLogger,
      mockTracer,
      docService,
      resolverService,
    );

    const diagnostics = await analysisService.loadDirectory();
    expect(diagnostics).toHaveLength(1);

    expect(diagnostics[0].uri).toBe(
      URI.file(join(analysisDir, 'test.ks')).toString(),
    );
  });
});
