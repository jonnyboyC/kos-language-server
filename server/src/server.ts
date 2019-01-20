/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  TextDocumentPositionParams,
  CompletionItemKind,
  SignatureHelp,
  Location,
  DidChangeWatchedFilesParams,
  SignatureInformation,
  ParameterInformation,
  DidOpenTextDocumentParams,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DocumentSymbolParams,
  SymbolInformation,
  SymbolKind,
} from 'vscode-languageserver';
import { empty } from './utilities/typeGuards';
import { Analyzer } from './analyzer';
import { IDiagnosticUri } from './types';
import { keywordCompletions } from './utilities/constants';
import { KsEntity } from './analysis/types';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let workspaceFolder: string = '';
const analyzer = new Analyzer(connection.console, connection.tracer);
const documents: TextDocuments = new TextDocuments();

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;
  connection.console.log(
    `[Server(${process.pid}) ${JSON.stringify(capabilities)}] Started and initialize received`);

  if (params.rootPath) {
    analyzer.volumne0Path = params.rootPath;
    workspaceFolder = params.rootPath;
  }

  if (params.rootUri) {
    analyzer.volumne0Uri = params.rootUri;
  }

  connection.console.log(
    `[Server(${process.pid}) ${workspaceFolder}] Started and initialize received`);

  return {
    capabilities: {
      textDocumentSync: documents.syncKind,

      // Tell the client that the server supports code completion
      completionProvider: {
        resolveProvider: true,
        // triggerCharacters: [':'],
      },

      signatureHelpProvider: {
        triggerCharacters: ['(', ','],
      },

      documentSymbolProvider: true,
      definitionProvider: true,
    },
  };
});

// monitor when the editor opens a document
connection.onDidOpenTextDocument((param: DidOpenTextDocumentParams) => {
  connection.console.log(`We received ${param.textDocument.uri} was opened`);
});

// monitor when a text document is changed
connection.onDidChangeTextDocument((param: DidChangeTextDocumentParams) => {
  connection.console.log(`We received ${param.contentChanges.length} file changes`);
});

// monitor file change events
connection.onDidChangeWatchedFiles((change: DidChangeWatchedFilesParams) => {
  connection.console.log(`We received ${change.changes.length} file change events`);
});

// monitor when a text document is closed
connection.onDidCloseTextDocument((param: DidCloseTextDocumentParams) => {
  connection.console.log(`We received ${param.textDocument.uri} was closed`);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async (change) => {
  const { diagnostics } = await analyzer
    .validateDocument(change.document.uri, change.document.getText());

  if (diagnostics.length === 0) {
    connection.sendDiagnostics({
      uri: change.document.uri,
      diagnostics: [],
    });
    return;
  }

  const diagnosticMap: { [uri: string]: IDiagnosticUri[] } = {};
  for (const diagnostic of diagnostics) {
    if (!diagnosticMap.hasOwnProperty(diagnostic.uri)) {
      diagnosticMap[diagnostic.uri] = [diagnostic];
    } else {
      diagnosticMap[diagnostic.uri].push(diagnostic);
    }
  }

  for (const uri in diagnosticMap) {
    connection.sendDiagnostics({
      uri,
      diagnostics: diagnosticMap[uri],
    });
  }
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (documentPosition: TextDocumentPositionParams): CompletionItem[] => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;
    const entities = analyzer.getEntitiesAtPosition(uri, position);

    return entities.map((entity) => {
      let kind: Maybe<CompletionItemKind> = undefined;
      switch (entity.tag) {
        case 'function':
          kind = CompletionItemKind.Function;
          break;
        case 'parameter':
          kind = CompletionItemKind.Variable;
          break;
        case 'lock':
          kind = CompletionItemKind.Variable;
          break;
        case 'variable':
          kind = CompletionItemKind.Variable;
          break;
        default:
          throw new Error('Unknown entity type');
      }

      return {
        kind,
        label: entity.name.lexeme,
        data: entity,
      } as CompletionItem;
    })
    .concat(keywordCompletions);
  },
);

// This handler provides signature help
connection.onSignatureHelp(
  (documentPosition: TextDocumentPositionParams): SignatureHelp => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    const result = analyzer.getFunctionAtPosition(uri, position);
    if (empty(result)) return defaultSigniture();

    const { func, index } = result;
    const { parameters } = func;
    return {
      signatures: [
        SignatureInformation.create(
          func.name.lexeme,
          undefined,
          ...parameters.map(param => ParameterInformation.create(param.name.lexeme)),
        ),
      ],
      activeParameter: index,
      activeSignature: 0,
    };
  },
);

connection.onDocumentSymbol(
  (documentSymbol: DocumentSymbolParams): Maybe<SymbolInformation[]> => {
    const { uri } = documentSymbol.textDocument;

    const entities = analyzer.getAllFileEntities(uri);
    return entities.map((entity) => {
      let kind: Maybe<SymbolKind> = undefined;
      switch (entity.tag) {
        case 'function':
          kind = SymbolKind.Function;
          break;
        case 'parameter':
          kind = SymbolKind.Variable;
          break;
        case 'lock':
          kind = SymbolKind.Variable;
          break;
        case 'variable':
          kind = SymbolKind.Variable;
          break;
        default:
          throw new Error('Unknown entity type');
      }

      return {
        kind,
        name: entity.name.lexeme,
        location: Location.create(entity.name.uri || uri, entity.name),
      } as SymbolInformation;
    });
  },
);

// This handler provides definition help
connection.onDefinition(
  (documentPosition: TextDocumentPositionParams): Maybe<Location> => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    const name = analyzer.getTokenAtPosition(uri, position);
    return name && Location.create(name.uri || uri, name);
  },
);

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    const entity = item.data as KsEntity;

    // this would be a possible spot to pull in doc string if present.
    if (!empty(entity) && !empty(entity.name.uri)) {
      const tracker = analyzer.getTrackerAtPosition(
        entity.name.uri,
        entity.name.start,
        entity.name.lexeme);

      if (!empty(tracker)) {
        item.detail = `${item.label}: ${tracker.declared.type.toTypeString()}`;
      }
    }

    if (!empty(entity)) {
      const tracker = analyzer.getGlobalTracker(
        entity.name.lexeme);

      if (!empty(tracker)) {
        item.detail = `${item.label}: ${tracker.declared.type.toTypeString()}`;
      }
    }

    return item;
  },
);

const defaultSigniture = (): SignatureHelp => ({
  signatures: [],
  activeParameter: null,
  activeSignature: null,
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
