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
  CompletionParams,
  CompletionTriggerKind,
  ReferenceParams,
  Hover,
} from 'vscode-languageserver';
import { empty } from './utilities/typeGuards';
import { Analyzer } from './analyzer';
import { IDiagnosticUri } from './types';
import { keywordCompletions } from './utilities/constants';
import { KsEntity } from './analysis/types';
import { entityCompletionItems, suffixCompletionItems } from './utilities/serverUtils';
import { Logger } from './utilities/logger';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let workspaceFolder: string = '';
const analyzer = new Analyzer(new Logger(connection.console, LogLevel.Warn), connection.tracer);
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
        triggerCharacters: [':'],
      },

      signatureHelpProvider: {
        triggerCharacters: ['(', ','],
      },

      hoverProvider: true,
      referencesProvider: true,
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

  const diagnosticResults = analyzer
    .validateDocument(change.document.uri, change.document.getText());

  let total = 0;
  const diagnosticMap: Map<string, IDiagnosticUri[]> = new Map();

  for await (const diagnostics of diagnosticResults) {
    total += diagnostics.length;

    for (const diagnostic of diagnostics) {
      let uriDiagnostics = diagnosticMap.get(diagnostic.uri);
      if (empty(uriDiagnostics)) {
        uriDiagnostics = [];
      }

      uriDiagnostics.push(diagnostic);
      diagnosticMap.set(diagnostic.uri, uriDiagnostics);
    }

    for (const [uri, uriDiagnostics] of diagnosticMap.entries()) {
      connection.sendDiagnostics({
        uri,
        diagnostics: uriDiagnostics,
      });
    }
  }

  // if not problems found clear out diagnostics
  if (total === 0) {
    connection.sendDiagnostics({
      uri: change.document.uri,
      diagnostics: [],
    });
  }
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (completionParams: CompletionParams): CompletionItem[] => {
    const { context } = completionParams;

    if (empty(context) || context.triggerKind !== CompletionTriggerKind.TriggerCharacter) {
      return entityCompletionItems(analyzer, completionParams)
        .concat(keywordCompletions);
    }

    return suffixCompletionItems(analyzer, completionParams);
  },
);

// This handler provides on hover capabilities
connection.onHover((positionParmas: TextDocumentPositionParams): Maybe<Hover> => {
  const { position } = positionParmas;
  const { uri } = positionParmas.textDocument;

  const token = analyzer.getToken(position, uri);
  if (empty(token)) {
    return undefined;
  }

  const tracker = analyzer.getScopedTracker(position, token.lexeme, uri);
  const type = analyzer.getType(position, token.lexeme, uri);

  if (empty(tracker) || empty(type)) {
    return undefined;
  }

  return {
    contents: `(${tracker.declared.entity.tag}) ${token.lexeme}: ${type.toTypeString()} `,
    range: token,
  };
});

// This handler providers find all references capabilities
connection.onReferences((referenceParams: ReferenceParams): Maybe<Location[]> => {
  const { position } = referenceParams;
  const { uri } = referenceParams.textDocument;

  return analyzer.getUsagesLocations(position, uri);
});

// This handler provides signature help
connection.onSignatureHelp(
  (documentPosition: TextDocumentPositionParams): SignatureHelp => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    const result = analyzer.getFunctionAtPosition(position, uri);
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

// This handler provider document symbols in file
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

    return analyzer.getDeclarationLocation(position, uri);
  },
);

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    const entity = item.data as KsEntity;

    // this would be a possible spot to pull in doc string if present.
    if (!empty(entity)) {
      const type = analyzer.getType(
        entity.name.start,
        entity.name.lexeme,
        entity.name.uri);

      if (!empty(type)) {
        item.detail = `${item.label}: ${type.toTypeString()}`;
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
