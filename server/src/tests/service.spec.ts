import { DocumentService } from '../services/documentService';
import { NotificationHandler } from 'vscode-jsonrpc';
import {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
  TextDocumentItem,
  Location,
  Range,
  TextDocument,
  VersionedTextDocumentIdentifier,
  Position,
  TextDocumentIdentifier,
} from 'vscode-languageserver';
import { mockLogger } from '../utilities/logger';
import { URI } from 'vscode-uri';
import { empty } from '../utilities/typeGuards';
import { zip } from '../utilities/arrayUtils';
import { basename } from 'path';
import { DocumentLoader, Document } from '../utilities/documentLoader';

const createMockDocConnection = () => ({
  changeDoc: undefined as Maybe<
    NotificationHandler<DidChangeTextDocumentParams>
  >,
  openDoc: undefined as Maybe<NotificationHandler<DidOpenTextDocumentParams>>,
  closeDoc: undefined as Maybe<NotificationHandler<DidCloseTextDocumentParams>>,

  onDidChangeTextDocument(
    handler: NotificationHandler<DidChangeTextDocumentParams>,
  ) {
    this.changeDoc = handler;
  },
  onDidCloseTextDocument(
    handler: NotificationHandler<DidCloseTextDocumentParams>,
  ) {
    this.closeDoc = handler;
  },
  onDidOpenTextDocument(
    handler: NotificationHandler<DidOpenTextDocumentParams>,
  ) {
    this.openDoc = handler;
  },

  callChange(params: DidChangeTextDocumentParams) {
    if (this.changeDoc) {
      this.changeDoc(params);
    }
  },

  callOpen(params: DidOpenTextDocumentParams) {
    if (this.openDoc) {
      this.openDoc(params);
    }
  },

  callClose(params: DidCloseTextDocumentParams) {
    if (this.closeDoc) {
      this.closeDoc(params);
    }
  },
});

const createMockUriResponse = (files: Map<string, string>): DocumentLoader => {
  return {
    load(path: string): Promise<string> {
      const document = files.get(path);

      if (!empty(document)) {
        return Promise.resolve(document);
      }

      return Promise.reject();
    },
    async *loadDirectory(_: string): AsyncIterableIterator<Document>  {
    },
  };
};

describe('documentService', () => {
  test('load from client', () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockUriResponse = createMockUriResponse(files);

    const docService = new DocumentService(
      mockConnection,
      mockUriResponse,
      mockLogger,
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

    docService.onChange(document => {
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
        expect(doc).not.toBeUndefined();

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

  test('load from server', async () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockUriResponse = createMockUriResponse(files);

    const baseUri = URI.file('/example/folder').toString();
    const callingUri = URI.file('/example/folder/example.ks').toString();

    const docService = new DocumentService(
      mockConnection,
      mockUriResponse,
      mockLogger,
      baseUri,
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

      const loadedDoc = await docService.loadDocument(
        Location.create(
          callingUri,
          Range.create({ line: 0, character: 0 }, { line: 0, character: 10 }),
        ),
        `0:/${basename(uriString)}`,
      );

      expect(loadedDoc).not.toBeUndefined();
      if (!empty(loadedDoc)) {
        expect(TextDocument.is(loadedDoc)).toBe(true);
        expect((loadedDoc as TextDocument).getText()).toBe(doc);
      }

      expect(clientDocs.size).toBe(0);
      expect(serverDocs.size).toBe(i + 1);
      expect(serverDocs.has(uri.toString())).toBe(true);

      for (let j = 0; j <= i; j += 1) {
        const doc = docService.getDocument(uris[j].toString());
        expect(doc).not.toBeUndefined();

        if (!empty(doc)) {
          expect(doc.getText()).toBe(docs[j]);
        }

        expect(serverDocs.has(uris[j].toString())).toBe(true);
      }

      i = i + 1;
    }
  });

  test('change update', async () => {
    const mockConnection = createMockDocConnection();
    const files = new Map();
    const mockUriResponse = createMockUriResponse(files);

    const baseUri = URI.file('/example/folder').toString();
    // const callingUri = URI.file('/example/folder/example.ks').toString();

    const docService = new DocumentService(
      mockConnection,
      mockUriResponse,
      mockLogger,
      baseUri,
    );

    const serverDocs = docService['serverDocs'];
    const clientDocs = docService['clientDocs'];

    const uri = URI.file('/example/folder/doc1.ks');
    const content = 'example';
    const afterEdit = 'example edited';

    let first = true;

    docService.onChange(document => {
      if (first) {
        expect(document.uri).toBe(uri.toString());
        expect(document.text).toBe(content);
        first = false;
      } else {
        expect(document.uri).toBe(uri.toString());
        expect(document.text).toBe(afterEdit);
      }
    });

    docService.onClose(closeUri => {
      expect(closeUri).toBe(uri.toString());
    });

    mockConnection.callOpen({
      textDocument: TextDocumentItem.create(
        uri.toString(),
        'kos',
        1,
        content,
      ),
    });

    expect(serverDocs.size).toBe(0);
    expect(clientDocs.size).toBe(1);

    let clientDoc = docService.getDocument(uri.toString());
    expect(clientDoc).not.toBeUndefined();
    if (!empty(clientDoc)) {
      expect(clientDoc.getText()).toBe(content);
    }

    mockConnection.callChange({
      textDocument: VersionedTextDocumentIdentifier.create(uri.toString(), 1),
      contentChanges: [{
        range: Range.create(Position.create(0, 7), Position.create(0, 7)),
        rangeLength: 0,
        text: ' edited',
      }],
    });

    expect(serverDocs.size).toBe(0);
    expect(clientDocs.size).toBe(1);

    clientDoc = docService.getDocument(uri.toString());
    expect(clientDoc).not.toBeUndefined();
    if (!empty(clientDoc)) {
      expect(clientDoc.getText()).toBe(afterEdit);
    }

    mockConnection.callClose({
      textDocument: TextDocumentIdentifier.create(uri.toString()),
    });

    expect(serverDocs.size).toBe(1);
    expect(clientDocs.size).toBe(0);

    clientDoc = docService.getDocument(uri.toString());
    expect(clientDoc).not.toBeUndefined();
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

    const docService = new DocumentService(
      mockConnection,
      mockUriResponse,
      mockLogger,
      baseUri,
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

      const loadedDoc = await docService.loadDocument(
        Location.create(
          callingUri,
          Range.create({ line: 0, character: 0 }, { line: 0, character: 10 }),
        ),
        `0:/${basename(uriString)}`,
      );

      expect(loadedDoc).not.toBeUndefined();
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
});
