import { DocumentService } from '../services/documentService';
import { NotificationHandler } from 'vscode-jsonrpc';
import {
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DidOpenTextDocumentParams,
} from 'vscode-languageserver';
import { mockLogger } from '../utilities/logger';

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

const createMockUriResponse = (obj: { response: string }) => (_: string) =>
  Promise.resolve(obj.response);

describe('documentService', () => {
  test('load from client', () => {
    const mockConnection = createMockDocConnection();
    const response = { response: 'first' };

    const docService = new DocumentService(
      mockConnection,
      createMockUriResponse(response),
      mockLogger,
    );
  });
});
