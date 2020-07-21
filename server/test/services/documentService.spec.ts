import {
  createMockIoService,
  createMockConnection,
} from '../utilities/mockServices';
import { URI } from 'vscode-uri';
import { DocumentService } from '../../src/services/documentService';
import { mockLogger, mockTracer } from '../../src/models/logger';
import {
  TextDocument,
  Range,
  Position,
  Location,
  TextDocumentContentChangeEvent,
  DidChangeTextDocumentNotification,
  DidOpenTextDocumentNotification,
  DidCloseTextDocumentNotification,
  DidOpenTextDocumentParams,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
} from 'vscode-languageserver';
import { empty } from '../../src/utilities/typeGuards';
import { zip } from '../../src/utilities/arrayUtils';
import { ResolverService } from '../../src/services/resolverService';
import { basename, join } from 'path';
import { IoService } from '../../src/services/ioService';

const TEST_LANGUAGE_ID = 'kos';
const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');
const loadDir = join(testDir, 'unitTests/loadFiles');

function mockOpenDocNotification(config: {
  uri: string;
  text: string;
}): DidOpenTextDocumentParams {
  return {
    textDocument: {
      ...config,
      languageId: TEST_LANGUAGE_ID,
      version: 0,
    },
  };
}

function mockChangeDocNotification(config: {
  uri: string;
  contentChanges: TextDocumentContentChangeEvent[];
}): DidChangeTextDocumentParams {
  const { uri, contentChanges } = config;
  return { contentChanges, textDocument: { uri, version: 0 } };
}

function mockCloseDocNotification(uri: string): DidCloseTextDocumentParams {
  return { textDocument: { uri } };
}

describe('document service', () => {
  test('ready work', async () => {
    const { server } = createMockConnection();
    const files = new Map();
    const mockIoService = createMockIoService(files);

    const baseUri = URI.file('/example/folder');

    const docService = new DocumentService(
      server,
      mockIoService,
      mockLogger,
      mockTracer,
    );
    docService.listen();

    expect(docService.ready()).toBe(false);
    docService.workspaceUri = baseUri;
    expect(docService.ready()).toBe(true);
  });

  test('getDocument work', () => {
    const { server } = createMockConnection();
    const files = new Map();
    const mockIoService = createMockIoService(files);

    const baseUri = URI.file('/example/folder');

    const docService = new DocumentService(
      server,
      mockIoService,
      mockLogger,
      mockTracer,
      baseUri,
    );
    docService.listen();

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
    const { server } = createMockConnection();
    const files = new Map();
    const mockIoService = createMockIoService(files);

    const baseUri = URI.file('/example/folder');

    const docService = new DocumentService(
      server,
      mockIoService,
      mockLogger,
      mockTracer,
      baseUri,
    );
    docService.listen();

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
    const { client, server } = createMockConnection();
    const files = new Map();
    const mockIoService = createMockIoService(files);

    const docService = new DocumentService(
      server,
      mockIoService,
      mockLogger,
      mockTracer,
    );
    docService.listen();

    const serverDocs = docService['serverDocs'];
    const clientDocs = docService['clientDocs'];

    const uris = [
      URI.file('/example/doc1.ks'),
      URI.file('/example/doc2.ks'),
      URI.file('/example/doc3.ks'),
      URI.file('/example/doc4.ks'),
    ];

    const docs = ['example 1', 'example 2', 'example 3', 'example 4'];
    let i = 0;

    docService.on('change', document => {
      expect(serverDocs.size).toBe(0);
      expect(clientDocs.size).toBe(i + 1);
      expect(document.uri).toBe(uris[i].toString());
      expect(document.getText()).toBe(docs[i]);

      for (let j = 0; j <= i; j += 1) {
        const doc = docService.getDocument(uris[j].toString());
        expect(doc).toBeDefined();

        if (!empty(doc)) {
          expect(doc.getText()).toBe(docs[j]);
        }

        expect(clientDocs.has(uris[j].toString())).toBe(true);
      }
      i += 1;
    });

    for (let i = 0; i < uris.length; i += 1) {
      client.sendNotification(
        DidOpenTextDocumentNotification.type,
        mockOpenDocNotification({
          uri: uris[i].toString(),
          text: docs[i],
        }),
      );
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
    const { server } = createMockConnection();
    const files = new Map();
    const mockIoResponse = createMockIoService(files);

    const baseUri = URI.file('/example/folder').toString();

    const docService = new DocumentService(
      server,
      mockIoResponse,
      mockLogger,
      mockTracer,
      URI.parse(baseUri),
    );
    docService.listen();

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
    const { client, server } = createMockConnection();
    const files = new Map();
    const mockIoService = createMockIoService(files);

    const baseUri = URI.file('/example/folder').toString();

    const docService = new DocumentService(
      server,
      mockIoService,
      mockLogger,
      mockTracer,
      URI.parse(baseUri),
    );
    docService.listen();

    const serverDocs = docService['serverDocs'];
    const clientDocs = docService['clientDocs'];

    const uri = URI.file('/example/folder/doc1.ks');
    const content = 'example';
    const afterEdit = 'example edited';

    let first = true;

    docService.on('change', document => {
      if (first) {
        expect(document.uri).toBe(uri.toString());
        expect(document.getText()).toBe(content);

        expect(serverDocs.size).toBe(0);
        expect(clientDocs.size).toBe(1);

        const clientDoc = docService.getDocument(uri.toString());
        expect(clientDoc).toBeDefined();
        if (!empty(clientDoc)) {
          expect(clientDoc.getText()).toBe(content);
        }

        first = false;
      } else {
        expect(document.uri).toBe(uri.toString());
        expect(document.getText()).toBe(afterEdit);

        expect(serverDocs.size).toBe(0);
        expect(clientDocs.size).toBe(1);

        const clientDoc = docService.getDocument(uri.toString());
        expect(clientDoc).toBeDefined();
        if (!empty(clientDoc)) {
          expect(clientDoc.getText()).toBe(afterEdit);
        }
      }
    });

    docService.on('close', closeUri => {
      expect(closeUri).toBe(uri.toString());

      expect(serverDocs.size).toBe(1);
      expect(clientDocs.size).toBe(0);

      const clientDoc = docService.getDocument(uri.toString());
      expect(clientDoc).toBeDefined();
      if (!empty(clientDoc)) {
        expect(clientDoc.getText()).toBe(afterEdit);
      }
    });

    client.sendNotification(
      DidOpenTextDocumentNotification.type,
      mockOpenDocNotification({
        uri: uri.toString(),
        text: content,
      }),
    );

    client.sendNotification(
      DidChangeTextDocumentNotification.type,
      mockChangeDocNotification({
        uri: uri.toString(),
        contentChanges: [
          {
            range: Range.create(Position.create(0, 7), Position.create(0, 7)),
            rangeLength: 0,
            text: ' edited',
          },
        ],
      }),
    );

    client.sendNotification(
      DidCloseTextDocumentNotification.type,
      mockCloseDocNotification(uri.toString()),
    );
  });

  test('load extension', async () => {
    const { server } = createMockConnection();
    const files = new Map();
    const mockUriResponse = createMockIoService(files);

    const baseUri = URI.file('/example/folder').toString();
    const callingUri = URI.file('/example/folder/example.ks').toString();
    const resolverService = new ResolverService(baseUri);

    const docService = new DocumentService(
      server,
      mockUriResponse,
      mockLogger,
      mockTracer,
      URI.parse(baseUri),
    );
    docService.listen();

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
      const { client, server } = createMockConnection();
      const files = new Map();
      const mockIoService = createMockIoService(files);

      const baseUri = URI.file('/example/folder');

      const docService = new DocumentService(
        server,
        mockIoService,
        mockLogger,
        mockTracer,
        baseUri,
      );
      docService.listen();

      const configContents = '{ "example": "example" }';
      const configUri = URI.file('/example/folder/ksconfig.json');

      docService.on('configChange', text => {
        expect(text.getText()).toBe(configContents);
      });

      client.sendNotification(
        DidOpenTextDocumentNotification.type,
        mockOpenDocNotification({
          uri: configUri.toString(),
          text: configContents,
        }),
      );
    });

    test('when config is changed', () => {
      const { client, server } = createMockConnection();
      const files = new Map();
      const mockIoService = createMockIoService(files);

      const baseUri = URI.file('/example/folder');

      const docService = new DocumentService(
        server,
        mockIoService,
        mockLogger,
        mockTracer,
        baseUri,
      );
      docService.listen();

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
      docService['clientConfigDoc'] = configDoc;

      docService.on('configChange', document => {
        expect(document.getText()).toBe(
          TextDocument.applyEdits(configDoc, [
            { range: (edits[0] as any).range, newText: edits[0].text },
          ]),
        );
      });

      client.sendNotification(
        DidChangeTextDocumentNotification.type,
        mockChangeDocNotification({
          uri: configUri.toString(),
          contentChanges: edits,
        }),
      );
    });
  });

  test('cacheDocument works', async () => {
    const { server } = createMockConnection();
    const mockUriResponse = new IoService();

    const baseUri = URI.file(loadDir);

    const docService = new DocumentService(
      server,
      mockUriResponse,
      mockLogger,
      mockTracer,
      URI.parse(baseUri.toString()),
    );
    docService.listen();

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
