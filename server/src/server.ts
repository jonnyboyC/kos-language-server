/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
  createConnection,
  TextDocuments,
  TextDocument,
  Diagnostic,
  DiagnosticSeverity,
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
} from 'vscode-languageserver';
import { Scanner } from './scanner/scanner';
import { ISyntaxError } from './scanner/types';
import { Parser } from './parser/parser';
import { IParseError } from './parser/types';
import { Resolver } from './analysis/resolver';
import { IResolverError } from './analysis/types';
import { ScopeManager } from './analysis/scopeManager';
import { FuncResolver } from './analysis/functionResolver';
import { empty } from './utilities/typeGuards';
import { SyntaxTree } from './entities/syntaxTree';
import { SyntaxTreeFind } from './parser/syntaxTreeFind';
import { CallExpr } from './parser/expr';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

interface IDocumentInfo {
  syntaxTree: SyntaxTree;
  scopeManager: ScopeManager;
}

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments = new TextDocuments();
let workspaceFolder: string = '';
const scopeMap: Map<string, IDocumentInfo> = new Map();

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;
  connection.console.log(
    `[Server(${process.pid}) ${JSON.stringify(capabilities)}] Started and initialize received`);

  if (params.rootUri) {
    workspaceFolder = params.rootUri;
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
        triggerCharacters: ['('],
      },
      definitionProvider: true,
    },
  };
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

// convert scan error to diagnostic
const scanToDiagnostics = (error: ISyntaxError): Diagnostic => {
  return {
    severity: DiagnosticSeverity.Error,
    range: { start: error.start, end: error.end },
    message: error.message,
    source: 'kos-language-server',
  };
};

// convert parse error to diagnostic
const parseToDiagnostics = (error: IParseError): Diagnostic => {
  return {
    severity: DiagnosticSeverity.Error,
    range: { start: error.token.start, end: error.token.end },
    message: error.message,
    source: 'kos-language-server',
  };
};

// convert resolver error to diagnostic
const resolverToDiagnostics = (error: IResolverError): Diagnostic => {
  return {
    severity: DiagnosticSeverity.Warning,
    range: { start: error.token.start, end: error.token.end },
    message: error.message,
    source: 'kos-language-server',
  };
};

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  // The validator creates diagnostics for all uppercase words length 2 and more
  const text = textDocument.getText();

  connection.console.log('');
  connection.console.log(`Scanning ${textDocument.uri}`);
  connection.console.log('');
  const scanner = new Scanner(text);
  const [tokens, scanErrors] = scanner.scanTokens();

  // if scanner found errors report those immediately
  if (scanErrors.length > 0) {
    connection.console.warn(`Scanning encountered ${scanErrors.length} Errors.`);
  }

  // parse scanned tokens
  connection.console.log(`Parsing ${textDocument.uri}`);
  connection.console.log('');
  const parser = new Parser(tokens);
  const [syntaxTree, parseErrors] = parser.parse();

  if (parseErrors.length > 0) {
    connection.console.warn(`Parser encountered ${parseErrors.length} Errors.`);
  }

  // generate a scope manager for resolving
  const scopeManager = new ScopeManager();

  // generate resolvers
  const funcResolver = new FuncResolver(syntaxTree, scopeManager);
  const resolver = new Resolver(syntaxTree, scopeManager);

  // resolve the rest of the script
  connection.console.log(`Function resolving ${textDocument.uri}`);
  connection.console.log('');
  let resolverErrors = funcResolver.resolve();

  // perform an initial function pass
  connection.console.log(`Resolving ${textDocument.uri}`);
  connection.console.log('');
  resolverErrors = resolverErrors.concat(resolver.resolve());

  if (resolverErrors.length > 0) {
    connection.console.warn(`Resolver encountered ${resolverErrors.length} Errors.`);
  }

  // generate all diagnostics
  const diagnostics: Diagnostic[] = scanErrors.map(error => scanToDiagnostics(error)).concat(
    parseErrors.length === 0 ? [] : parseErrors.map(error => error.inner.concat(error))
      .reduce((acc, current) => acc.concat(current))
      .map(error => parseToDiagnostics(error)),
    resolverErrors
      .map(error => resolverToDiagnostics(error)),
    );

  scopeMap.set(textDocument.uri, {
    scopeManager,
    syntaxTree,
  });
  connection.sendDiagnostics({ diagnostics, uri: textDocument.uri });
}

connection.onDidChangeWatchedFiles((change: DidChangeWatchedFilesParams) => {
  // Monitored files have change in VSCode
  connection.console.log(`We received ${change.changes.length} file change events`);
});

connection.onDefinition(
  (documentPosition: TextDocumentPositionParams): Maybe<Location> => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    const documentInfo = scopeMap.get(uri);
    if (empty(documentInfo)
      || empty(documentInfo.scopeManager)
      || empty(documentInfo.syntaxTree)) {
      return undefined;
    }

    const { scopeManager, syntaxTree } = documentInfo;
    const finder = new SyntaxTreeFind();
    const result = finder.find(syntaxTree, position);

    if (empty(result)) {
      return undefined;
    }

    const { token } = result;
    const entity = scopeManager.entityAtPosition(position, token.lexeme);
    if (empty(entity)) {
      return undefined;
    }

    return Location.create(uri, entity.name);
  },
);

connection.onSignatureHelp(
  (documentPosition: TextDocumentPositionParams): SignatureHelp => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    const documentInfo = scopeMap.get(uri);

    // we need the document info to lookup a signiture
    if (!empty(documentInfo)) {
      const { syntaxTree } = documentInfo;
      const finder = new SyntaxTreeFind();

      // attempt to find a token here
      const result = finder.find(syntaxTree, position, CallExpr);
      if (!empty(result)) {
        const { node, token } = result;

        // make sure our token is in a calling context
        if (node instanceof CallExpr) {

          // resolve the token to make sure it's actually a function
          const ksFunction = documentInfo.scopeManager.entityAtPosition(position, token.lexeme);
          if (!empty(ksFunction) && ksFunction.tag === 'function') {
            const { parameters } = ksFunction;
            let idx = 0;

            // tslint:disable-next-line:no-increment-decrement
            for (const arg of node.args) {
              const found = finder.find(arg, position);
              if (!empty(found)) {
                break;
              }

              // tslint:disable-next-line:no-increment-decrement
              idx++;
            }

            return {
              signatures: [
                SignatureInformation.create(
                  ksFunction.name.lexeme,
                  undefined,
                  ...parameters.map(param => ParameterInformation.create(param.name.lexeme)),
                ),
              ],
              activeParameter: idx,
              activeSignature: 0,
            };
          }
        }
      }
    }

    return {
      signatures: [],
      activeParameter: null,
      activeSignature: null,
    };
  },
);

// This handler provides the inentitiesAtPositionitial list of the completion items.
connection.onCompletion(
  (documentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.

    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;
    const completionItems: CompletionItem[] = [];

    const documentInfo = scopeMap.get(uri);

    if (!empty(documentInfo) && !empty(documentInfo.scopeManager)) {
      const entities = documentInfo.scopeManager
        .entitiesAtPosition(position);

      return completionItems.concat(
        entities.map((entity) => {
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
              throw new Error();
          }

          return {
            kind,
            label: entity.name.lexeme,
            data: entity,
          };
        }),
      );
    }

    return completionItems;
  },
);

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    // this would be a possible spot to pull in doc string if present.
    return item;
  },
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
