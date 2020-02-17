import {
  TextDocument,
  createConnection,
} from 'vscode-languageserver';
import { IoService, Document } from '../../src/services/ioService';
import { empty } from '../../src/utilities/typeGuards';
import { DocumentService } from '../../src/services/documentService';
import { URI } from 'vscode-uri';
import { EventEmitter } from 'events';
import { AnalysisService } from '../../src/services/analysisService';
import { DocumentInfo, DiagnosticUri } from '../../src/types';
import { PassThrough } from 'stream';

/**
 * Create a mock client and server connection
 */
export const createMockConnection = () => {
  const up = new PassThrough();
  const down = new PassThrough();

  const server = createConnection(up, down);
  const client = createConnection(down, up);

  server.listen();
  client.listen();

  return {
    server,
    client,
  };
};

/**
 * Create a mock io service for testing
 * @param files files this io service will response with
 */
export const createMockIoService = (files: Map<string, string>): IoService => {
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

/**
 * Create a mock document service for testing.
 * @param documents Documents this service will respond to
 */
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
    async cacheDocuments() {},
    async loadDocument(uri: string): Promise<Maybe<TextDocument>> {
      return Promise.resolve(documents.get(uri));
    },
  }) as DocumentService;
};

export const createMockAnalysisService = (
  docInfo: Map<string, DocumentInfo>,
): AnalysisService => {
  const emitter = new EventEmitter();

  return Object.assign(emitter, {
    setCase(_: CaseKind) {
      return this;
    },
    setBodies(_: string[]) {
      return this;
    },
    analyzeDocument(_: string, __: string): Promise<DiagnosticUri[]> {
      return Promise.resolve([]);
    },
    loadInfo(uri: string): Promise<Maybe<DocumentInfo>> {
      return Promise.resolve(docInfo.get(uri));
    },
    getInfo(uri: string): Maybe<DocumentInfo> {
      return docInfo.get(uri);
    },
  }) as AnalysisService;
};
