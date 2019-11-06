import {
  createMockDocConnection,
  createMockUriResponse,
} from '../utilities/mockServices';
import { URI } from 'vscode-uri';
import { DocumentService } from '../../src/services/documentService';
import { mockLogger, mockTracer } from '../../src/models/logger';
import {
  TextDocumentItem,
  TextDocument,
  VersionedTextDocumentIdentifier,
  Range,
  Position,
  TextDocumentIdentifier,
  Location,
  TextDocumentContentChangeEvent,
} from 'vscode-languageserver';
import { empty } from '../../src/utilities/typeGuards';
import { zip } from '../../src/utilities/arrayUtils';
import { ResolverService } from '../../src/services/resolverService';
import { basename, join } from 'path';
import { IoService } from '../../src/services/IoService';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');
const loadDir = join(testDir, 'unitTests/loadFiles');

describe('document service', () => {
  test('ready work', async () => {
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

  test('getDocument work', () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockIoService = createMockUriResponse(files);

    const baseUri = URI.file('/example/folder');

    const docService = new DocumentService(
      mockConnection,
      mockIoService,
      mockLogger,
      mockTracer,
      baseUri,
    );

    const clientUri = URI.file('/example/folder/client.ks');
    const serverUri = URI.file('/example/folder/server.ks');

    const clientSrc = TextDocument.create(
      clientUri.toString(),
      'kos',
      0,
      'client',
    );
    const serverSrc = TextDocument.create(
      serverUri.toString(),
      'kos',
      0,
      'server',
    );

    docService['clientDocs'].set(clientUri.toString(), clientSrc);
    docService['serverDocs'].set(serverUri.toString(), serverSrc);

    expect(docService.getDocument('file:///example/folder/client.ks')).toBe(
      clientSrc,
    );
    expect(docService.getDocument('file:///example/folder/client.ksm')).toBe(
      clientSrc,
    );
    expect(docService.getDocument('file:///example/folder/client')).toBe(
      clientSrc,
    );

    expect(
      docService.getDocument('file:///example/folder/client.rb'),
    ).toBeUndefined();

    expect(docService.getDocument('file:///example/folder/server.ks')).toBe(
      serverSrc,
    );
    expect(docService.getDocument('file:///example/folder/server.ksm')).toBe(
      serverSrc,
    );
    expect(docService.getDocument('file:///example/folder/server')).toBe(
      serverSrc,
    );

    expect(
      docService.getDocument('file:///example/folder/server.rb'),
    ).toBeUndefined();

    expect(docService.getDocument('file:///example.ks')).toBeUndefined();
  });

  test('getAllDocuments work', () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockIoService = createMockUriResponse(files);

    const baseUri = URI.file('/example/folder');

    const docService = new DocumentService(
      mockConnection,
      mockIoService,
      mockLogger,
      mockTracer,
      baseUri,
    );

    const clientUri = URI.file('/example/folder/client.ks');
    const serverUri = URI.file('/example/folder/server.ks');

    const clientSrc = TextDocument.create(
      clientUri.toString(),
      'kos',
      0,
      'client',
    );
    const serverSrc = TextDocument.create(
      serverUri.toString(),
      'kos',
      0,
      'server',
    );

    docService['clientDocs'].set(clientUri.toString(), clientSrc);
    docService['serverDocs'].set(serverUri.toString(), serverSrc);

    const documents = docService.getAllDocuments();
    expect(documents).toContain(clientSrc);
    expect(documents).toContain(serverSrc);
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

  test('loadDocument works', async () => {
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

  test('on change event', async () => {
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

  describe('configChange Event', () => {
    test('when config is opened', () => {
      const mockConnection = createMockDocConnection();
      const files = new Map();
      const mockIoService = createMockUriResponse(files);

      const baseUri = URI.file('/example/folder');

      const docService = new DocumentService(
        mockConnection,
        mockIoService,
        mockLogger,
        mockTracer,
        baseUri,
      );

      const configContents = '{ "example": "example" }';
      const configUri = URI.file('/example/folder/ksconfig.json');

      docService.on('configChange', text => {
        expect(text).toBe(configContents);
      });

      mockConnection.callOpen({
        textDocument: TextDocumentItem.create(
          configUri.toString(),
          'kos',
          1,
          configContents,
        ),
      });
    });

    test('when config is changed', () => {
      const mockConnection = createMockDocConnection();
      const files = new Map();
      const mockIoService = createMockUriResponse(files);

      const baseUri = URI.file('/example/folder');

      const docService = new DocumentService(
        mockConnection,
        mockIoService,
        mockLogger,
        mockTracer,
        baseUri,
      );

      const configContents = '{ "example": "example" }';
      const configUri = URI.file('/example/folder/ksconfig.json');
      const configDoc = TextDocument.create(
        configUri.toString(),
        'kos',
        1,
        configContents,
      );

      const edits: TextDocumentContentChangeEvent[] = [
        {
          range: Range.create(Position.create(0, 7), Position.create(0, 7)),
          rangeLength: 0,
          text: ' edited',
        },
      ];
      docService['config'] = configDoc;

      docService.on('configChange', text => {
        expect(text).toBe(
          TextDocument.applyEdits(configDoc, [
            { range: edits[0].range!, newText: edits[0].text },
          ]),
        );
      });

      mockConnection.callChange({
        textDocument: VersionedTextDocumentIdentifier.create(
          configUri.toString(),
          0,
        ),
        contentChanges: edits,
      });
    });
  });

  test('cacheDocument works', async () => {
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
