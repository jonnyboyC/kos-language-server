import { NotificationHandler } from 'vscode-jsonrpc';
import {
  DidChangeTextDocumentParams,
  DidOpenTextDocumentParams,
  DidCloseTextDocumentParams,
  TextDocument,
} from 'vscode-languageserver';
import { IoService, Document } from '../../services/IoService';
import { empty } from '../../utilities/typeGuards';
import { DocumentService } from '../../services/documentService';
import { URI } from 'vscode-uri';
import { EventEmitter } from 'events';

export const createMockDocConnection = () => ({
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

export const createMockUriResponse = (
  files: Map<string, string>,
): IoService => {
  return {
    load(path: string): Promise<string> {
      const document = files.get(path);

      if (!empty(document)) {
        return Promise.resolve(document);
      }

      return Promise.reject();
    },
    async *loadDirectory(_: string): AsyncIterableIterator<Document> {},
    exists(uri: URI): Maybe<URI> {
      return uri;
    },
    statDirectory() {
      return [];
    },
  };
};

export const createMockDocumentService = (
  documents: Map<string, TextDocument>,
): DocumentService => {
  const emitter = new EventEmitter();

  return Object.assign(emitter, {
    ready(): boolean {
      return true;
    },
    getDocument(uri: string): Maybe<TextDocument> {
      return documents.get(uri);
    },
    getAllDocuments(): TextDocument[] {
      return [...documents.values()];
    },
    async loadDocument(uri: string): Promise<Maybe<TextDocument>> {
      return Promise.resolve(documents.get(uri));
    },
  }) as DocumentService;
};
