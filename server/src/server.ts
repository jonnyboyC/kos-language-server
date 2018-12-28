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
import { performance } from 'perf_hooks';
import { InvalidInst } from './parser/inst';
import { signitureHelper } from './utilities/signitureHelper';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

interface IDocumentInfo {
  syntaxTree: SyntaxTree;
  scopeManager: ScopeManager;
}

// Create a simple text document manager. The text document manager
// supports full document sync only
let workspaceFolder: string = '';
const documents: TextDocuments = new TextDocuments();
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
        triggerCharacters: ['(', ','],
      },
      definitionProvider: true,
    },
  };
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  updateDocumentValidation(change.document);
});

connection.onDidChangeWatchedFiles((change: DidChangeWatchedFilesParams) => {
  // Monitored files have change in VSCode
  connection.console.log(`We received ${change.changes.length} file change events`);
});

// This handler provides definition help
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

// This handler provides signature help
connection.onSignatureHelp(
  (documentPosition: TextDocumentPositionParams): SignatureHelp => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    // we need the document info to lookup a signiture
    const documentInfo = scopeMap.get(uri);
    if (empty(documentInfo)) return defaultSigniture();

    const { syntaxTree } = documentInfo;
    const finder = new SyntaxTreeFind();

    // attempt to find a token here get surround invalid inst context
    const result = finder.find(syntaxTree, position, InvalidInst);

    // currently we only support invalid instructions for signiture completion
    // we could possible support call expressions as well
    if (empty(result) || empty(result.node) || !(result.node instanceof InvalidInst)) {
      return defaultSigniture();
    }

    // determine the identifier of the invalid instruction and parameter index
    const { node } = result;
    const identifierIndex = signitureHelper(node.tokens, position);
    if (empty(identifierIndex)) return defaultSigniture();

    const { identifier, index } = identifierIndex;

    // resolve the token to make sure it's actually a function
    const ksFunction = documentInfo.scopeManager.entityAtPosition(position, identifier);
    if (empty(ksFunction) || ksFunction.tag !== 'function') {
      return defaultSigniture();
    }

    const { parameters } = ksFunction;
    return {
      signatures: [
        SignatureInformation.create(
          ksFunction.name.lexeme,
          undefined,
          ...parameters.map(param => ParameterInformation.create(param.name.lexeme)),
        ),
      ],
      activeParameter: index,
      activeSignature: 0,
    };
  },
);

const defaultSigniture = (): SignatureHelp => ({
  signatures: [],
  activeParameter: null,
  activeSignature: null,
});

// This handler provides the initial list of the completion items.
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

// when a document has been updated revalidate it
const updateDocumentValidation = async (textDocument: TextDocument): Promise<void> => {
  return validateDocument(textDocument.uri, textDocument.getText());
};

// main validation code
const validateDocument = async (uri: string, text: string): Promise<void> => {
  return new Promise(() => {
    connection.console.log('');
    connection.console.log(`Scanning ${uri}`);
    connection.console.log('');

    performance.mark('scanner-start');
    const scanner = new Scanner();
    const [tokens, scanErrors] = scanner.scanTokens(text);
    performance.mark('scanner-end');

    // if scanner found errors report those immediately
    if (scanErrors.length > 0) {
      connection.console.warn(`Scanning encountered ${scanErrors.length} Errors.`);
    }

    // parse scanned tokens
    connection.console.log(`Parsing ${uri}`);
    connection.console.log('');

    performance.mark('parser-start');
    const parser = new Parser();
    const [syntaxTree, parseErrors] = parser.parse(tokens);
    performance.mark('parser-end');

    if (parseErrors.length > 0) {
      connection.console.warn(`Parser encountered ${parseErrors.length} Errors.`);
    }

    // generate a scope manager for resolving
    const scopeMan = new ScopeManager();

    // generate resolvers
    const funcResolver = new FuncResolver();
    const resolver = new Resolver();

    // resolve the rest of the script
    connection.console.log(`Function resolving ${uri}`);
    connection.console.log('');
    performance.mark('func-resolver-start');
    let resolverErrors = funcResolver.resolve(syntaxTree, scopeMan);
    performance.mark('func-resolver-end');

    // perform an initial function pass
    connection.console.log(`Resolving ${uri}`);
    connection.console.log('');

    performance.mark('resolver-start');
    resolverErrors = resolverErrors.concat(resolver.resolve(syntaxTree, scopeMan));
    performance.mark('resolver-end');

    performance.measure('scanner', 'scanner-start', 'scanner-end');
    performance.measure('parser', 'parser-start', 'parser-end');
    performance.measure('func-resolver', 'func-resolver-start', 'func-resolver-end');
    performance.measure('resolver', 'resolver-start', 'resolver-end');

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

    const [scannerMeasure] = performance.getEntriesByName('scanner');
    const [parserMeasure] = performance.getEntriesByName('parser');
    const [funcResolverMeasure] = performance.getEntriesByName('func-resolver');
    const [resolverMeasure] = performance.getEntriesByName('resolver');

    connection.console.log('');
    connection.console.log('-------- performance ---------');
    connection.console.log(`Scanner took ${scannerMeasure.duration} ms`);
    connection.console.log(`Parser took ${parserMeasure.duration} ms`);
    connection.console.log(`Function Resolver took ${funcResolverMeasure.duration} ms`);
    connection.console.log(`Resolver took ${resolverMeasure.duration} ms`);

    scopeMap.set(uri, {
      syntaxTree,
      scopeManager: scopeMan,
    });
    connection.sendDiagnostics({ diagnostics, uri });

    performance.clearMarks();
    performance.clearMeasures();
  });
};

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

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
