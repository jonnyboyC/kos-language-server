import { SymbolService } from '../../src/services/symbolService';
import { ResolverService } from '../../src/services/resolverService';
import {
  createMockDocumentService,
  createMockIoService,
  createMockConnection,
} from '../utilities/mockServices';
import { URI } from 'vscode-uri';
import { DocumentService } from '../../src/services/documentService';
import { IoService } from '../../src/services/ioService';
import { AnalysisService } from '../../src/services/analysisService';
import { mockLogger, mockTracer } from '../../src/models/logger';
import {
  Connection,
  TextDocument,
  ReferencesRequest,
  ReferenceParams,
  Position,
  Location,
  Range,
  DocumentSymbolRequest,
  DocumentSymbolParams,
  SymbolInformation,
  SymbolKind,
  DefinitionRequest,
  TextDocumentPositionParams,
  HoverRequest,
  DocumentHighlightRequest,
  DocumentHighlight,
  DocumentHighlightKind,
  WorkspaceSymbolRequest,
  WorkspaceSymbolParams,
  RenameRequest,
  RenameParams,
  WorkspaceEdit,
  TextEdit,
} from 'vscode-languageserver';
import { serverName } from '../../src/utilities/constants';
import { join } from 'path';

const rootUri = URI.file('/example/folder');
const caseKind = CaseKind.camelCase;

interface IDefaultMocks {
  client: Connection;
  server: Connection;
  docService: DocumentService;
  ioService: IoService;
  resolverService: ResolverService;
  analysisService: AnalysisService;
}

const makeDoc = (uri: URI, text: string): TextDocument => {
  return TextDocument.create(uri.toString(), serverName, 1, text);
};

function defaultMocks(
  documents: Map<string, TextDocument> = new Map(),
): IDefaultMocks {
  const files = new Map<string, string>();
  for (const [uri, document] of documents) {
    files.set(uri, document.getText());
  }

  const ioService = createMockIoService(files);
  const docService = createMockDocumentService(documents);
  const resolverService = new ResolverService(rootUri.toString());
  const analysisService = new AnalysisService(
    caseKind,
    mockLogger,
    mockTracer,
    docService,
    resolverService,
  );

  return {
    ioService,
    docService,
    resolverService,
    analysisService,
    ...createMockConnection(),
  };
}

interface IReferenceMock {
  uri: string;
  position: Position;
  includeDeclaration?: boolean;
}

interface IDefinitionMock {
  uri: string;
  position: Position;
}

interface IRenameMock {
  uri: string;
  position: Position;
  newName: string;
}

function mockReferenceRequest({
  uri,
  position,
  includeDeclaration = true,
}: IReferenceMock): ReferenceParams {
  return {
    position,
    context: {
      includeDeclaration,
    },
    textDocument: {
      uri,
    },
  };
}

function mockDocumentSymbolRequest(uri: string): DocumentSymbolParams {
  return {
    textDocument: {
      uri,
    },
  };
}

function mockPositionParams({
  uri,
  position,
}: IDefinitionMock): TextDocumentPositionParams {
  return {
    position,
    textDocument: {
      uri,
    },
  };
}

function mockWorkspaceSymbolRequest(query: string): WorkspaceSymbolParams {
  return {
    query,
  };
}

function mockRenameRequest({
  uri,
  position,
  newName,
}: IRenameMock): RenameParams {
  return {
    position,
    newName,
    textDocument: {
      uri,
    },
  };
}

describe('symbol service', () => {
  let documents: Map<string, TextDocument>;
  let dependencies: ReturnType<typeof defaultMocks>;
  let symbolService: SymbolService;
  let doc1Uri: URI;
  let doc2Uri: URI;

  beforeEach(() => {
    doc1Uri = URI.file(join(rootUri.fsPath, 'example1.ks'));
    doc2Uri = URI.file(join(rootUri.fsPath, 'example2.ks'));

    documents = new Map();
    documents.set(
      doc1Uri.toString(),
      makeDoc(
        doc1Uri,
        [
          'runPath("example2.ks").',
          'local x to 5.',
          'local y to 10.',
          'print(pick(x, y)).',
        ].join('\n'),
      ),
    );

    documents.set(
      doc2Uri.toString(),
      makeDoc(
        doc2Uri,
        [
          'function pick {',
          '  parameter x, y.',
          '  return choose x if random() < 0.5 else y.',
          '}',
        ].join('\n'),
      ),
    );

    dependencies = defaultMocks(documents);
    symbolService = new SymbolService(
      dependencies.server,
      dependencies.resolverService,
      dependencies.ioService,
      dependencies.docService,
      dependencies.analysisService,
    );
  });

  test('can constructs a new instance', () => {
    const {
      server,
      docService,
      ioService,
      resolverService,
      analysisService,
    } = dependencies;

    expect(
      new SymbolService(
        server,
        resolverService,
        ioService,
        docService,
        analysisService,
      ),
    ).toBeTruthy();
  });

  describe('when requesting references to a symbol', () => {
    describe('when not pointing to a symbol', () => {
      test('returns null', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          ReferencesRequest.type,
          mockReferenceRequest({
            uri: doc1Uri.toString(),
            position: Position.create(0, 0),
            includeDeclaration: true,
          }),
        );

        expect(response).toBeNull();
      });
    });

    describe('when in the same file', () => {
      describe('when including declaration', () => {
        test('it find the reference', async () => {
          const { client, analysisService } = dependencies;
          await analysisService.loadDirectory();
          symbolService.listen();

          const response = await client.sendRequest(
            ReferencesRequest.type,
            mockReferenceRequest({
              uri: doc1Uri.toString(),
              position: Position.create(2, 6),
              includeDeclaration: true,
            }),
          );

          const expected: Location[] = [
            {
              uri: doc1Uri.toString(),
              range: Range.create(Position.create(2, 6), Position.create(2, 7)),
            },
            {
              uri: doc1Uri.toString(),
              range: Range.create(
                Position.create(3, 14),
                Position.create(3, 15),
              ),
            },
          ];

          expect(response).toBeDefined();
          expect(response).toStrictEqual(expected);
        });
      });

      describe('when excluding declaration', () => {
        test('it find the reference', async () => {
          const { client, analysisService } = dependencies;
          await analysisService.loadDirectory();
          symbolService.listen();

          const response = await client.sendRequest(
            ReferencesRequest.type,
            mockReferenceRequest({
              uri: doc1Uri.toString(),
              position: Position.create(2, 6),
              includeDeclaration: false,
            }),
          );

          const expected: Location[] = [
            {
              uri: doc1Uri.toString(),
              range: Range.create(
                Position.create(3, 14),
                Position.create(3, 15),
              ),
            },
          ];

          expect(response).toBeDefined();
          expect(response).toStrictEqual(expected);
        });
      });
    });

    describe('when in difference files', () => {
      describe('when including declaration', () => {
        test('it find the reference', async () => {
          const { client, analysisService } = dependencies;
          await analysisService.loadDirectory();
          symbolService.listen();

          const response = await client.sendRequest(
            ReferencesRequest.type,
            mockReferenceRequest({
              uri: doc1Uri.toString(),
              position: Position.create(3, 6),
              includeDeclaration: true,
            }),
          );

          const expected: Location[] = [
            {
              uri: doc2Uri.toString(),
              range: Range.create(
                Position.create(0, 9),
                Position.create(0, 13),
              ),
            },
            {
              uri: doc1Uri.toString(),
              range: Range.create(
                Position.create(3, 6),
                Position.create(3, 10),
              ),
            },
          ];

          expect(response).toBeDefined();
          expect(response).toStrictEqual(expected);
        });
      });

      describe('when excluding declaration', () => {
        test('it find the reference', async () => {
          const { client, analysisService } = dependencies;
          await analysisService.loadDirectory();
          symbolService.listen();

          const response = await client.sendRequest(
            ReferencesRequest.type,
            mockReferenceRequest({
              uri: doc1Uri.toString(),
              position: Position.create(3, 6),
              includeDeclaration: false,
            }),
          );

          const expected: Location[] = [
            {
              uri: doc1Uri.toString(),
              range: Range.create(
                Position.create(3, 6),
                Position.create(3, 10),
              ),
            },
          ];

          expect(response).toBeDefined();
          expect(response).toStrictEqual(expected);
        });
      });
    });
  });

  describe('when requesting document symbols', () => {
    test('it returns the files symbols', async () => {
      const { client, analysisService } = dependencies;
      await analysisService.loadDirectory();
      symbolService.listen();

      const response = await client.sendRequest(
        DocumentSymbolRequest.type,
        mockDocumentSymbolRequest(doc1Uri.toString()),
      );

      const expected: SymbolInformation[] = [
        {
          name: 'x',
          kind: SymbolKind.Variable,
          location: Location.create(
            doc1Uri.toString(),
            Range.create(Position.create(1, 0), Position.create(1, 12)),
          ),
        },
        {
          name: 'y',
          kind: SymbolKind.Variable,
          location: Location.create(
            doc1Uri.toString(),
            Range.create(Position.create(2, 0), Position.create(2, 13)),
          ),
        },
      ];

      expect(response).toBeDefined();
      expect(response).toStrictEqual(expected);
    });
  });

  describe('when requesting symbol definition', () => {
    describe('when not pointing to a symbol', () => {
      test('return null', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          DefinitionRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(1, 0),
          }),
        );

        expect(response).toBeNull();
      });
    });

    describe('when pointing to a run statement', () => {
      test('return resolved path', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          DefinitionRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(0, 0),
          }),
        );

        expect(response).toEqual({
          uri: doc2Uri.toString(),
          range: Range.create(Position.create(0, 0), Position.create(0, 0)),
        });
      });
    });

    describe('when the symbol is defined in this file', () => {
      test('it returns the symbol definition location', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          DefinitionRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(3, 14),
          }),
        );

        expect(response).toEqual({
          uri: doc1Uri.toString(),
          range: Range.create(Position.create(2, 6), Position.create(2, 7)),
        });
      });
    });

    describe('when the symbol is defined in another file', () => {
      test('it returns the symbol definition location', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          DefinitionRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(3, 6),
          }),
        );

        expect(response).toEqual({
          uri: doc2Uri.toString(),
          range: Range.create(Position.create(0, 9), Position.create(0, 13)),
        });
      });
    });
  });

  describe('when requesting workspace symbol definition', () => {
    describe('when a bad query', () => {
      test('returns null', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          WorkspaceSymbolRequest.type,
          mockWorkspaceSymbolRequest('@@@@@@@@@@@@'),
        );

        expect(response).toStrictEqual([]);
      });
    });

    describe('when a good query', () => {
      test('returns relevant symbols', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          WorkspaceSymbolRequest.type,
          mockWorkspaceSymbolRequest('pick'),
        );

        const expected: SymbolInformation[] = [
          {
            name: 'pick',
            kind: SymbolKind.Function,
            location: {
              uri: doc2Uri.toString(),
              range: Range.create(Position.create(0, 0), Position.create(3, 1)),
            },
          },
        ];

        expect(response).toBeDefined();
        expect(response).toStrictEqual(expected);
      });
    });
  });

  describe('when requesting a hover ', () => {
    describe('when not pointing to a symbol', () => {
      test('return resolved path', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          HoverRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(1, 0),
          }),
        );

        expect(response).toBeNull();
      });
    });

    describe('when hovering over a symbol', () => {
      test('it returns a hover type definition', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          HoverRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(3, 14),
          }),
        );

        expect(response).toEqual({
          contents: {
            language: 'kos',
            value: '(variable) y: int',
          },
          range: Range.create(Position.create(3, 14), Position.create(3, 15)),
        });
      });
    });

    describe('when hovering over a literal', () => {
      test('it returns the literal definition location', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          HoverRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(2, 11),
          }),
        );

        expect(response).toEqual({
          contents: {
            language: 'kos',
            value: '(literal) 10: int',
          },
          range: Range.create(Position.create(2, 11), Position.create(2, 13)),
        });
      });
    });
  });

  describe('when requesting document highlight', () => {
    describe('when not pointing to a symbol', () => {
      test('returns null', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          DocumentHighlightRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(0, 0),
          }),
        );

        expect(response).toBeNull();
      });
    });

    describe('when in the same file', () => {
      test('it returns the locations of the symbol', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          DocumentHighlightRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(2, 6),
          }),
        );

        const expected: DocumentHighlight[] = [
          {
            kind: DocumentHighlightKind.Write,
            range: Range.create(Position.create(2, 6), Position.create(2, 7)),
          },
          {
            kind: DocumentHighlightKind.Read,
            range: Range.create(Position.create(3, 14), Position.create(3, 15)),
          },
        ];

        expect(response).toBeDefined();
        expect(response).toStrictEqual(expected);
      });
    });

    describe('when in difference files', () => {
      test('it returns the location of the symbol', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          DocumentHighlightRequest.type,
          mockPositionParams({
            uri: doc1Uri.toString(),
            position: Position.create(3, 6),
          }),
        );

        const expected: DocumentHighlight[] = [
          {
            kind: DocumentHighlightKind.Read,
            range: Range.create(Position.create(3, 6), Position.create(3, 10)),
          },
        ];

        expect(response).toBeDefined();
        expect(response).toStrictEqual(expected);
      });
    });
  });

  describe('when requesting a rename', () => {
    describe('when not pointing to a symbol', () => {
      test('returns null', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          RenameRequest.type,
          mockRenameRequest({
            uri: doc1Uri.toString(),
            position: Position.create(1, 0),
            newName: 'global',
          }),
        );

        expect(response).toBeNull();
      });
    });

    describe('when pointing to a symbol', () => {
      test('returns text edits', async () => {
        const { client, analysisService } = dependencies;
        await analysisService.loadDirectory();
        symbolService.listen();

        const response = await client.sendRequest(
          RenameRequest.type,
          mockRenameRequest({
            uri: doc2Uri.toString(),
            position: Position.create(0, 11),
            newName: 'select',
          }),
        );

        const expected: WorkspaceEdit = {
          changes: {
            [doc1Uri.toString()]: [
              TextEdit.replace(
                Range.create(Position.create(3, 6), Position.create(3, 10)),
                'select',
              ),
            ],
            [doc2Uri.toString()]: [
              TextEdit.replace(
                Range.create(Position.create(0, 9), Position.create(0, 13)),
                'select',
              ),
            ],
          },
        };
        expect(response).toBeDefined();
        expect(response).toStrictEqual(expected);
      });
    });
  });
});
