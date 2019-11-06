import { DocumentService } from '../../src/services/documentService';
import {
  TextDocumentItem,
  Location,
  Range,
  TextDocument,
  VersionedTextDocumentIdentifier,
  Position,
  TextDocumentIdentifier,
  FoldingRange,
} from 'vscode-languageserver';
import { mockLogger, mockTracer } from '../../src/models/logger';
import { URI } from 'vscode-uri';
import { empty } from '../../src/utilities/typeGuards';
import { zip } from '../../src/utilities/arrayUtils';
import { basename, join } from 'path';
import { Scanner } from '../../src/scanner/scanner';
import { Parser } from '../../src/parser/parser';
import { Tokenized } from '../../src/scanner/types';
import { Ast } from '../../src/parser/types';
import { FoldableService } from '../../src/services/foldableService';
import {
  createMockDocConnection,
  createMockUriResponse,
  createMockDocumentService,
} from '../utilities/mockServices';
import { AnalysisService } from '../../src/services/analysisService';
import { typeInitializer } from '../../src/typeChecker/initialize';
import { ResolverService } from '../../src/services/resolverService';
import {
  IoService,
  Document,
  IoKind,
  IoEntity,
} from '../../src/services/IoService';
import { DocumentInfo, DiagnosticUri } from '../../src/types';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');
const loadDir = join(testDir, 'unitTests/loadFiles');
const analysisDir = join(testDir, 'unitTests/analysis');
typeInitializer();

describe('resolver service', () => {
  test('path resolver', () => {
    const pathResolver = new ResolverService();
    const range = {
      start: {
        line: 0,
        character: 0,
      },
      end: {
        line: 0,
        character: 1,
      },
    };

    const otherFileLocation: Location = {
      range,
      uri: 'file:///root/example/otherFile.ks',
    };

    const otherDirLocation: Location = {
      range,
      uri: 'file:///root/example/up/upFile.ks',
    };

    const relative1 = ['relative', 'path', 'file.ks'].join('/');
    const relative2 = ['..', 'relative', 'path', 'file.ks'].join('/');
    const absolute = ['0:', 'relative', 'path', 'file.ks'].join('/');
    const weird = ['0:relative', 'path', 'file.ks'].join('/');

    expect(pathResolver.resolve(otherFileLocation, relative1)).toBeUndefined();
    expect(pathResolver.resolve(otherDirLocation, relative2)).toBeUndefined();
    expect(pathResolver.resolve(otherFileLocation, absolute)).toBeUndefined();
    expect(pathResolver.resolve(otherFileLocation, weird)).toBeUndefined();

    pathResolver.rootVolume = URI.file(join('root', 'example'));

    const resolvedUri = 'file:///root/example/relative/path/file.ks';

    const relativeResolved1 = pathResolver.resolve(
      otherFileLocation,
      relative1,
    );
    expect(undefined).not.toBe(relativeResolved1);
    if (!empty(relativeResolved1)) {
      expect(relativeResolved1.toString()).toBe(resolvedUri);
    }

    const relativeResolved2 = pathResolver.resolve(otherDirLocation, relative2);
    expect(undefined).not.toBe(relativeResolved2);
    if (!empty(relativeResolved2)) {
      expect(relativeResolved2.toString()).toBe(resolvedUri);
    }

    const absoluteResolved = pathResolver.resolve(otherFileLocation, absolute);
    expect(undefined).not.toBe(absoluteResolved);
    if (!empty(absoluteResolved)) {
      expect(absoluteResolved.toString()).toBe(resolvedUri);
    }

    const weirdResolved = pathResolver.resolve(otherFileLocation, weird);
    expect(undefined).not.toBe(weirdResolved);
    if (!empty(weirdResolved)) {
      expect(weirdResolved.toString()).toBe(resolvedUri);
    }
  });

  test('path resolver boot', () => {
    const pathResolver = new ResolverService();
    const range = {
      start: {
        line: 0,
        character: 0,
      },
      end: {
        line: 0,
        character: 1,
      },
    };

    const bootFileLocation: Location = {
      range,
      uri: 'file:///root/example/boot/otherFile.ks',
    };

    const relative1 = ['relative', 'path', 'file.ks'].join('/');
    const absolute = ['0:', 'relative', 'path', 'file.ks'].join('/');
    const weird = ['0:relative', 'path', 'file.ks'].join('/');

    expect(pathResolver.resolve(bootFileLocation, relative1)).toBeUndefined();
    expect(pathResolver.resolve(bootFileLocation, absolute)).toBeUndefined();
    expect(pathResolver.resolve(bootFileLocation, weird)).toBeUndefined();

    pathResolver.rootVolume = URI.file(join('root', 'example'));

    const resolvedUri = 'file:///root/example/relative/path/file.ks';

    const relativeResolved1 = pathResolver.resolve(bootFileLocation, relative1);
    expect(relativeResolved1).toBeDefined();
    if (!empty(relativeResolved1)) {
      expect(relativeResolved1.toString()).toBe(resolvedUri);
    }

    const absoluteResolved = pathResolver.resolve(bootFileLocation, absolute);
    expect(absoluteResolved).toBeDefined();
    if (!empty(absoluteResolved)) {
      expect(absoluteResolved.toString()).toBe(resolvedUri);
    }

    const weirdResolved = pathResolver.resolve(bootFileLocation, weird);
    expect(weirdResolved).toBeDefined();
    if (!empty(weirdResolved)) {
      expect(weirdResolved.toString()).toBe(resolvedUri);
    }
  });
});

describe('document service', () => {
  test('ready', async () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockIoService = createMockUriResponse(files);

    const baseUri = URI.file('/example/folder');

    const docService = new DocumentService(
      mockConnection,
      mockIoService,
      mockLogger,
      mockTracer,
    );

    expect(docService.ready()).toBe(false);
    docService.rootVolume = baseUri;

    expect(docService.ready()).toBe(true);
  });

  test('load from client', () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockIoService = createMockUriResponse(files);

    const docService = new DocumentService(
      mockConnection,
      mockIoService,
      mockLogger,
      mockTracer,
    );

    const serverDocs = docService['serverDocs'];
    const clientDocs = docService['clientDocs'];

    let i = 0;

    const uris = [
      URI.file('/example/doc1.ks'),
      URI.file('/example/doc2.ks'),
      URI.file('/example/doc3.ks'),
      URI.file('/example/doc4.ks'),
    ];

    const docs = ['example 1', 'example 2', 'example 3', 'example 4'];

    docService.on('change', document => {
      expect(document.uri).toBe(uris[i].toString());
      expect(document.text).toBe(docs[i]);
    });

    for (i = 0; i < uris.length; i += 1) {
      mockConnection.callOpen({
        textDocument: TextDocumentItem.create(
          uris[i].toString(),
          'kos',
          1,
          docs[i],
        ),
      });

      expect(serverDocs.size).toBe(0);
      expect(clientDocs.size).toBe(i + 1);

      for (let j = 0; j <= i; j += 1) {
        const doc = docService.getDocument(uris[j].toString());
        expect(doc).toBeDefined();

        if (!empty(doc)) {
          expect(doc.getText()).toBe(docs[j]);
        }

        expect(clientDocs.has(uris[j].toString())).toBe(true);
      }
    }

    const documents = docService.getAllDocuments();
    for (const document of documents) {
      let found = false;
      for (const [uri, doc] of zip(uris, docs)) {
        if (uri.toString() === document.uri && doc === document.getText()) {
          found = true;
        }
      }

      expect(found).toBe(true);
    }
  });

  test('load from server using uri', async () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockIoResponse = createMockUriResponse(files);

    const baseUri = URI.file('/example/folder').toString();

    const docService = new DocumentService(
      mockConnection,
      mockIoResponse,
      mockLogger,
      mockTracer,
      URI.parse(baseUri),
    );

    const serverDocs = docService['serverDocs'];
    const clientDocs = docService['clientDocs'];

    const uris = [
      URI.file('/example/folder/doc1.ks'),
      URI.file('/example/folder/doc2.ks'),
      URI.file('/example/folder/doc3.ks'),
      URI.file('/example/folder/doc4.ks'),
    ];

    const docs = ['example 1', 'example 2', 'example 3', 'example 4'];

    let i = 0;
    for (const [uri, doc] of zip(uris, docs)) {
      const uriString = uri.toString();
      files.set(uri.fsPath, doc);

      const loadedDoc = await docService.loadDocument(uriString);

      expect(loadedDoc).toBeDefined();
      if (!empty(loadedDoc)) {
        expect(TextDocument.is(loadedDoc)).toBe(true);
        expect((loadedDoc as TextDocument).getText()).toBe(doc);
      }

      expect(clientDocs.size).toBe(0);
      expect(serverDocs.size).toBe(i + 1);
      expect(serverDocs.has(uri.toString())).toBe(true);

      for (let j = 0; j <= i; j += 1) {
        const doc = docService.getDocument(uris[j].toString());
        expect(doc).toBeDefined();

        if (!empty(doc)) {
          expect(doc.getText()).toBe(docs[j]);
        }

        expect(serverDocs.has(uris[j].toString())).toBe(true);
      }

      i = i + 1;
    }

    const nonExistentUri = [
      URI.file('/example/folder/none1.ks'),
      URI.file('/example/folder/none2.ks'),
    ];

    for (const uri of nonExistentUri) {
      const uriString = uri.toString();
      const loadedDoc = await docService.loadDocument(uriString);
      expect(loadedDoc).toBeUndefined();
    }
  });

  test('change update', async () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockIoService = createMockUriResponse(files);

    const baseUri = URI.file('/example/folder').toString();

    const docService = new DocumentService(
      mockConnection,
      mockIoService,
      mockLogger,
      mockTracer,
      URI.parse(baseUri),
    );

    const serverDocs = docService['serverDocs'];
    const clientDocs = docService['clientDocs'];

    const uri = URI.file('/example/folder/doc1.ks');
    const content = 'example';
    const afterEdit = 'example edited';

    let first = true;

    docService.on('change', document => {
      if (first) {
        expect(document.uri).toBe(uri.toString());
        expect(document.text).toBe(content);
        first = false;
      } else {
        expect(document.uri).toBe(uri.toString());
        expect(document.text).toBe(afterEdit);
      }
    });

    docService.on('close', closeUri => {
      expect(closeUri).toBe(uri.toString());
    });

    mockConnection.callOpen({
      textDocument: TextDocumentItem.create(uri.toString(), 'kos', 1, content),
    });

    expect(serverDocs.size).toBe(0);
    expect(clientDocs.size).toBe(1);

    let clientDoc = docService.getDocument(uri.toString());
    expect(clientDoc).toBeDefined();
    if (!empty(clientDoc)) {
      expect(clientDoc.getText()).toBe(content);
    }

    mockConnection.callChange({
      textDocument: VersionedTextDocumentIdentifier.create(uri.toString(), 1),
      contentChanges: [
        {
          range: Range.create(Position.create(0, 7), Position.create(0, 7)),
          rangeLength: 0,
          text: ' edited',
        },
      ],
    });

    expect(serverDocs.size).toBe(0);
    expect(clientDocs.size).toBe(1);

    clientDoc = docService.getDocument(uri.toString());
    expect(clientDoc).toBeDefined();
    if (!empty(clientDoc)) {
      expect(clientDoc.getText()).toBe(afterEdit);
    }

    mockConnection.callClose({
      textDocument: TextDocumentIdentifier.create(uri.toString()),
    });

    expect(serverDocs.size).toBe(1);
    expect(clientDocs.size).toBe(0);

    clientDoc = docService.getDocument(uri.toString());
    expect(clientDoc).toBeDefined();
    if (!empty(clientDoc)) {
      expect(clientDoc.getText()).toBe(afterEdit);
    }
  });

  test('load extension', async () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockUriResponse = createMockUriResponse(files);

    const baseUri = URI.file('/example/folder').toString();
    const callingUri = URI.file('/example/folder/example.ks').toString();
    const resolverService = new ResolverService(baseUri);

    const docService = new DocumentService(
      mockConnection,
      mockUriResponse,
      mockLogger,
      mockTracer,
      URI.parse(baseUri),
    );

    const serverDocs = docService['serverDocs'];
    const clientDocs = docService['clientDocs'];

    const actualUri = [
      URI.file('/example/folder/doc1.ks'),
      URI.file('/example/folder/doc2.ks'),
      URI.file('/example/folder/doc3.ks'),
    ];

    const requestedUri = [
      URI.file('/example/folder/doc1.ks'),
      URI.file('/example/folder/doc2.ksm'),
      URI.file('/example/folder/doc3'),
      URI.file('/example/folder/doc4.txt'),
    ];

    const doc = 'example';

    let i = 0;
    for (const [aUri, rUri] of zip(actualUri, requestedUri)) {
      const uriString = rUri.toString();
      files.set(aUri.fsPath, doc);

      const resolvedUri = resolverService.resolve(
        Location.create(
          callingUri,
          Range.create({ line: 0, character: 0 }, { line: 0, character: 10 }),
        ),
        `0:/${basename(uriString)}`,
      );
      expect(resolvedUri).toBeDefined();

      const loadedDoc = await docService.loadDocument(resolvedUri!.toString());

      expect(loadedDoc).toBeDefined();
      if (!empty(loadedDoc)) {
        expect(TextDocument.is(loadedDoc)).toBe(true);
        expect((loadedDoc as TextDocument).getText()).toBe(doc);
      }

      expect(clientDocs.size).toBe(0);
      expect(serverDocs.size).toBe(i + 1);

      expect(serverDocs.has(aUri.toString())).toBe(true);
      i += 1;
    }
  });

  test('cache document', async () => {
    const mockConnection = createMockDocConnection();
    const mockUriResponse = new IoService();

    const baseUri = URI.file(loadDir);

    const docService = new DocumentService(
      mockConnection,
      mockUriResponse,
      mockLogger,
      mockTracer,
      URI.parse(baseUri.toString()),
    );

    await docService.cacheDocuments();

    const serverDocs = docService['serverDocs'];
    const clientDocs = docService['clientDocs'];

    const fileUris = [
      URI.file(join(baseUri.fsPath, 'example.ks')),
      URI.file(join(baseUri.fsPath, 'empty', 'empty.ks')),
    ];

    expect(clientDocs.size).toBe(0);
    expect(serverDocs.size).toBe(fileUris.length);

    for (const uri of fileUris) {
      expect(serverDocs.has(uri.toString())).toBe(true);
    }
  });
});

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

describe('io service', () => {
  test('load a document', async () => {
    const ioService = new IoService();
    const contents = await ioService.load(join(loadDir, 'example.ks'));
    expect(contents).toBe('print("hi").');
  });

  test('load a directory', async () => {
    const ioService = new IoService();

    const documents: Document[] = [];
    for await (const document of ioService.loadDirectory(loadDir)) {
      documents.push(document);
    }

    expect(documents).toHaveLength(2);
  });

  test('get stats on directory with partial', async () => {
    const ioService = new IoService();

    const entities = ioService.statDirectory(
      URI.file(join(loadDir, 'something')),
    );
    expect(entities).toHaveLength(2);

    const entityMap = new Map<IoKind, IoEntity>();
    for (const entity of entities) {
      entityMap.set(entity.kind, entity);
    }

    expect(entityMap.has(IoKind.file)).toBe(true);
    expect(entityMap.has(IoKind.directory)).toBe(true);

    expect(entityMap.get(IoKind.file)!.uri.toString()).toBe(
      URI.file(join(loadDir, 'example.ks')).toString(),
    );
    expect(entityMap.get(IoKind.directory)!.uri.toString()).toBe(
      URI.file(join(loadDir, 'empty')).toString(),
    );
  });

  test('get stats on directory with full', async () => {
    const ioService = new IoService();

    const entities = ioService.statDirectory(URI.file(loadDir));
    expect(entities).toHaveLength(2);

    const entityMap = new Map<IoKind, IoEntity>();
    for (const entity of entities) {
      entityMap.set(entity.kind, entity);
    }

    expect(entityMap.has(IoKind.file)).toBe(true);
    expect(entityMap.has(IoKind.directory)).toBe(true);

    expect(entityMap.get(IoKind.file)!.uri.toString()).toBe(
      URI.file(join(loadDir, 'example.ks')).toString(),
    );
    expect(entityMap.get(IoKind.directory)!.uri.toString()).toBe(
      URI.file(join(loadDir, 'empty')).toString(),
    );
  });

  test('does a file exist', async () => {
    const ioService = new IoService();

    const ksUri = ioService.exists(URI.file(join(loadDir, 'example.ks')));
    const ksmUri = ioService.exists(URI.file(join(loadDir, 'example.ksm')));
    const blankUri = ioService.exists(URI.file(join(loadDir, 'example')));

    expect(ksUri).toBeDefined();
    expect(ksmUri).toBeDefined();
    expect(blankUri).toBeDefined();

    const match = [ksUri, ksmUri, blankUri]
      .map(uri => uri!.toString())
      .every(uri => uri === ksUri!.toString());

    expect(match).toBe(true);

    const invalidUri = ioService.exists(URI.file(join(loadDir, 'example.js')));
    expect(invalidUri).toBeUndefined();
  });
});

// #region string scripts
const regionFold = `
// #region

// #endregion
`;

const blockFold = `
if true {

}

function example {
  print("hi").
}
`;

const bothFold = `
// #region
if true {

}

function example {
  print("hi").
}
// #endregion
`;
// #endregion

const fakeUri = 'file:///fake.ks';

interface ScanParseResult {
  scan: Tokenized;
  parse: Ast;
}

// parse source
const parseSource = (source: string): ScanParseResult => {
  const scanner = new Scanner(source, fakeUri);
  const scan = scanner.scanTokens();

  const parser = new Parser(fakeUri, scan.tokens);
  const parse = parser.parse();

  return { scan, parse };
};

const noParseErrors = (result: ScanParseResult): void => {
  expect(result.scan.scanDiagnostics).toHaveLength(0);
  expect(result.parse.parseDiagnostics).toHaveLength(0);
};

describe('foldableService', () => {
  test('Fold region', () => {
    const result = parseSource(regionFold);
    noParseErrors(result);

    const service = new FoldableService();
    const foldable = service.findRegions(
      result.parse.script,
      result.scan.regions,
    );

    const folds: FoldingRange[] = [
      {
        startCharacter: 0,
        startLine: 1,
        endCharacter: 13,
        endLine: 3,
        kind: 'region',
      },
    ];

    expect(foldable).toContainEqual(folds[0]);
  });

  test('Fold block', () => {
    const result = parseSource(blockFold);
    noParseErrors(result);

    const service = new FoldableService();
    const foldable = service.findRegions(
      result.parse.script,
      result.scan.regions,
    );

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

  test('Fold both', () => {
    const result = parseSource(bothFold);
    noParseErrors(result);

    const service = new FoldableService();
    const foldable = service.findRegions(
      result.parse.script,
      result.scan.regions,
    );

    expect(foldable).toHaveLength(3);
    const folds: FoldingRange[] = [
      {
        startCharacter: 8,
        startLine: 2,
        endCharacter: 1,
        endLine: 4,
        kind: 'region',
      },
      {
        startCharacter: 17,
        startLine: 6,
        endCharacter: 1,
        endLine: 8,
        kind: 'region',
      },
      {
        startCharacter: 0,
        startLine: 1,
        endCharacter: 13,
        endLine: 9,
        kind: 'region',
      },
    ];

    expect(foldable).toContainEqual(folds[0]);
    expect(foldable).toContainEqual(folds[1]);
    expect(foldable).toContainEqual(folds[2]);
  });
});
