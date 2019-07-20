import { NotificationHandler } from 'vscode-jsonrpc';
import {
  DidChangeTextDocumentParams,
  DidOpenTextDocumentParams,
  DidCloseTextDocumentParams,
  TextDocument,
  Location,
  Diagnostic,
} from 'vscode-languageserver';
import { DocumentLoader, Document } from '../../utilities/documentLoader';
import { empty } from '../../utilities/typeGuards';
import { DocumentService } from '../../services/documentService';
import { URI } from 'vscode-uri';

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
): DocumentLoader => {
  return {
    load(path: string): Promise<string> {
      const document = files.get(path);

      if (!empty(document)) {
        return Promise.resolve(document);
      }

      return Promise.reject();
    },
    async *loadDirectory(_: string): AsyncIterableIterator<Document> {},
  };
};

export const createMockDocumentService = (
  documents: Map<string, TextDocument>,
): DocumentService => {
  return {
    ready(): boolean {
      return true;
    },
    async setVolume0Uri(_: URI) {
      return Promise.resolve();
    },
    getDocument(uri: string): Maybe<TextDocument> {
      return documents.get(uri);
    },
    getAllDocuments(): TextDocument[] {
      return [...documents.values()];
    },
    async loadDocumentFromScript(
      _: Location,
      __: string,
    ): Promise<Maybe<Diagnostic | TextDocument>> {
      return Promise.resolve(undefined);
    },
    async loadDocument(uri: string): Promise<Maybe<TextDocument>> {
      return Promise.resolve(documents.get(uri));
    },
    onChange(_: (document: Document) => void) {},
    onClose(_: (uri: string) => void) {},
  } as DocumentService;
};
