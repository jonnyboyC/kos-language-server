'use strict';

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  TextDocumentPositionParams,
  Location,
  DidChangeWatchedFilesParams,
  DidOpenTextDocumentParams,
  DidChangeTextDocumentParams,
  DidCloseTextDocumentParams,
  DocumentSymbolParams,
  SymbolInformation,
  CompletionParams,
  ReferenceParams,
  Hover,
  Diagnostic,
  MessageReader,
  MessageWriter,
  DidChangeConfigurationNotification,
  DocumentHighlight,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
} from 'vscode-languageserver';
import { empty } from './utilities/typeGuards';
import { Analyzer } from './analyzer';
import { KsSymbolKind } from './analysis/types';
import {
  symbolCompletionItems,
  suffixCompletionItems,
  documentSymbols,
  getConnectionPrimitives,
  updateServer,
} from './utilities/serverUtils';
import { Logger } from './utilities/logger';
import { primitiveInitializer } from './typeChecker/types/primitives/initialize';
import { oribitalInitializer } from './typeChecker/types/orbital/initialize';
import {
  cleanDiagnostic,
  cleanLocation,
  cleanPosition,
  cleanRange,
} from './utilities/clean';
import { keywordCompletions, serverName } from './utilities/constants';
import { Token } from './entities/token';
import { TypeKind } from './typeChecker/types/types';

export interface IClientConfiguration {
  completionCase: 'lowercase' | 'uppercase' | 'camelcase' | 'pascalcase';
  kerbalSpaceProgramPath?: string;
  telnetHost: string;
  telnetPort: number;
  lspPort: number;
  trace: {
    server: {
      verbosity: 'off' | 'message' | 'verbose';
      format: 'text' | 'json';
      level: 'verbose' | 'info' | 'log' | 'warn' | 'error' | 'none';
    };
  };
}

export interface IClientCapabilities {
  hasConfiguration: boolean;
  hasWorkspaceFolder: boolean;
}

export interface IServer {
  reader: MessageReader;
  writer: MessageWriter;
  workspaceFolder: string;
  workspaceUri: string;
  keywords: CompletionItem[];
  clientConfig: IClientConfiguration;
  clientCapability: IClientCapabilities;
  analyzer: Analyzer;
}

// get connection primitives based on command argument
const { reader, writer } = getConnectionPrimitives(process.argv[2]);

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(
  ProposedFeatures.all,
  reader,
  writer,
);

// REMOVE ME TODO probably need to refactor the type modules as
// structure and the primitives have a dependnecy loop
primitiveInitializer();
oribitalInitializer();

// default client configuration
const defaultClientConfiguration: IClientConfiguration = {
  kerbalSpaceProgramPath: undefined,
  telnetHost: '127.0.0.1',
  telnetPort: 5410,
  lspPort: 7000,
  completionCase: 'camelcase',
  trace: {
    server: {
      verbosity: 'off',
      format: 'text',
      level: 'error',
    },
  },
};

// create server options object
const server: IServer = {
  reader,
  writer,
  workspaceFolder: '',
  workspaceUri: '',
  clientCapability: {
    hasConfiguration: false,
    hasWorkspaceFolder: false,
  },
  keywords: keywordCompletions(CaseKind.camelcase),
  clientConfig: defaultClientConfiguration,
  analyzer: new Analyzer(
    CaseKind.camelcase,
    new Logger(connection.console, LogLevel.info),
    connection.tracer,
  ),
};

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments = new TextDocuments();

/**
 * Initialize the server from the client
 */
connection.onInitialize((params: InitializeParams) => {
  const { capabilities, rootPath, rootUri } = params;

  connection.console.log(
    `[Server(${process.pid}) ${JSON.stringify(
      capabilities,
      undefined,
      2,
    )}] Started and initialize received`,
  );

  // does the client support configurations
  server.clientCapability.hasConfiguration = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );

  // does the client support workspace folders
  server.clientCapability.hasWorkspaceFolder = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  // get root path if it exists
  if (rootPath) {
    server.analyzer.setPath(rootPath);
    server.workspaceFolder = rootPath;
  }

  // get root uri if it exists
  if (rootUri) {
    server.analyzer.setUri(rootUri);
    server.workspaceUri = rootUri;
  }

  connection.console.log(
    `[Server(${process.pid}) ${
      server.workspaceFolder
    }] Started and initialize received`,
  );

  return {
    capabilities: {
      textDocumentSync: documents.syncKind,

      // Tell the client that the server supports code completion
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: [':', '(', ', '],
      },

      signatureHelpProvider: {
        triggerCharacters: ['(', ', '],
      },

      documentHighlightProvider: true,
      hoverProvider: true,
      referencesProvider: true,
      documentSymbolProvider: true,
      definitionProvider: true,
    },
  };
});

/**
 * Once connection is initialized make additional registrations based
 * on client capability
 */
connection.onInitialized(async () => {
  const { clientCapability } = server;

  // register for all configuration changes.
  if (clientCapability.hasConfiguration) {
    connection.client.register(DidChangeConfigurationNotification.type, {
      section: serverName,
    });
  }

  // register workspace changes
  if (clientCapability.hasWorkspaceFolder) {
    connection.workspace.onDidChangeWorkspaceFolders(_ => {
      connection.console.log('Workspace folder change event received.');
    });
  }

  server.clientConfig = await getDocumentSettings();
  updateServer(server);
});

/**
 * When the client changes a configuration update our server settings
 */
connection.onDidChangeConfiguration(change => {
  const { clientCapability } = server;

  if (clientCapability.hasConfiguration) {
    if (change.settings && serverName in change.settings) {
      Object.assign(
        server.clientConfig,
        defaultClientConfiguration,
        change.settings[serverName],
      );
    }

    // update server on client config
    updateServer(server);
  }
});

// monitor when the editor opens a document
connection.onDidOpenTextDocument((param: DidOpenTextDocumentParams) => {
  connection.console.info(`We received ${param.textDocument.uri} was opened`);
});

// monitor when a text document is changed
connection.onDidChangeTextDocument((param: DidChangeTextDocumentParams) => {
  connection.console.info(
    `We received ${param.contentChanges.length} file changes`,
  );
});

// monitor file change events
connection.onDidChangeWatchedFiles((change: DidChangeWatchedFilesParams) => {
  connection.console.info(
    `We received ${change.changes.length} file change events`,
  );
});

// monitor when a text document is closed
connection.onDidCloseTextDocument((param: DidCloseTextDocumentParams) => {
  connection.console.info(`We received ${param.textDocument.uri} was closed`);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(async change => {
  try {
    const diagnosticResults = server.analyzer.validateDocument(
      change.document.uri,
      change.document.getText(),
    );

    let total = 0;
    const diagnosticMap: Map<string, Diagnostic[]> = new Map();

    // retrieve diagnostics from analyzer
    for await (const diagnostics of diagnosticResults) {
      total += diagnostics.length;

      for (const diagnostic of diagnostics) {
        const uriDiagnostics = diagnosticMap.get(diagnostic.uri);
        if (empty(uriDiagnostics)) {
          diagnosticMap.set(diagnostic.uri, [cleanDiagnostic(diagnostic)]);
        } else {
          uriDiagnostics.push(cleanDiagnostic(diagnostic));
        }
      }
    }

    // send diagnostics to each document reported
    for (const [uri, diagnostics] of diagnosticMap.entries()) {
      connection.sendDiagnostics({
        uri,
        diagnostics,
      });
    }

    // if not problems found clear out diagnostics
    if (total === 0) {
      connection.sendDiagnostics({
        uri: change.document.uri,
        diagnostics: [],
      });
    }
  } catch (e) {
    connection.console.error('kos-language-server Error occured:');
    if (e instanceof Error) {
      connection.console.error(e.message);

      if (!empty(e.stack)) {
        connection.console.error(e.stack);
      }
    } else {
      connection.console.error(JSON.stringify(e));
    }
  }
});

/**
 * This handler provide completition items capability
 */
connection.onCompletion(
  (completionParams: CompletionParams): CompletionItem[] => {
    const { context } = completionParams;

    try {

      // check if suffix completion
      if (!empty(context) && !empty(context.triggerCharacter)) {
        const { triggerCharacter } = context;

        if (triggerCharacter === ':') {
          return suffixCompletionItems(server.analyzer, completionParams);
        }
      }

      // complete base symbols
      return symbolCompletionItems(
        server.analyzer,
        completionParams,
        server.keywords,
      );

      // catch any errors
    } catch (err) {
      if (err instanceof Error) {
        connection.console.warn(`${err.message} ${err.stack}`);
      }

      return [];
    }
  },
);

/**
 * This handler provides document highlighting capability
 */
connection.onDocumentHighlight(
  (positionParams: TextDocumentPositionParams): DocumentHighlight[] => {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    const locations = server.analyzer.getFileUsageRanges(position, uri);
    return empty(locations)
      ? []
      : locations.map(range => ({ range: cleanRange(range) }));
  },
);

/**
 * This handlers provides on hover capability
 */
connection.onHover(
  (positionParams: TextDocumentPositionParams): Maybe<Hover> => {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    const token = server.analyzer.getToken(position, uri);

    if (empty(token)) {
      return undefined;
    }

    const { tracker } = token;
    if (empty(tracker)) {
      return undefined;
    }

    const type = tracker.getType({ uri, range: token });
    const symbolKind = tracker.declared.symbol.tag;

    if (empty(type)) {
      return undefined;
    }

    return {
      contents: {
        // Note doesn't does do much other than format it as code
        // may look into adding type def syntax highlighting
        language: 'kos',
        value: `(${KsSymbolKind[symbolKind]}) ${
          token.lexeme
        }: ${type.toTypeString()} `,
      },
      range: {
        start: cleanPosition(token.start),
        end: cleanPosition(token.end),
      },
    };
  },
);

/**
 * This handler provides the find all reference capability
 */
connection.onReferences(
  (referenceParams: ReferenceParams): Maybe<Location[]> => {
    const { position } = referenceParams;
    const { uri } = referenceParams.textDocument;

    const locations = server.analyzer.getUsageLocations(position, uri);
    return locations && locations.map(loc => cleanLocation(loc));
  },
);

// This handler provides signature help
connection.onSignatureHelp(
  (documentPosition: TextDocumentPositionParams): SignatureHelp => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    const result = server.analyzer.getFunctionAtPosition(position, uri);
    if (empty(result)) return defaultSigniture();
    const { index, tracker } = result;

    const label = typeof(tracker.declared.symbol.name) === 'string'
      ? tracker.declared.symbol.name
      : tracker.declared.symbol.name.lexeme;

    const type = tracker.getType({ uri, range: { start: position, end: position } });

    if (empty(type)) {
      return defaultSigniture();
    }

    switch (type.kind) {
      case TypeKind.function:
      case TypeKind.suffix:
        const paramInfos: ParameterInformation[] = Array.isArray(type.params)
          ? type.params.map(p => ParameterInformation.create(p.toTypeString()))
          : [ParameterInformation.create(type.params.toTypeString())];

        return {
          signatures: [
            SignatureInformation.create(
              label,
              undefined,
              ...paramInfos,
            ),
          ],
          activeParameter: index,
          activeSignature: 0,
        };
      default:
        return defaultSigniture();
    }

  },
);

/**
 * This handler provides document symbols capability
 */
connection.onDocumentSymbol(
  (documentSymbol: DocumentSymbolParams): Maybe<SymbolInformation[]> => {
    return documentSymbols(server.analyzer, documentSymbol);
  },
);

/**
 * This handler provides defintition capability
 */
connection.onDefinition(
  (documentPosition: TextDocumentPositionParams): Maybe<Location> => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    const location = server.analyzer.getDeclarationLocation(position, uri);
    return location && cleanLocation(location);
  },
);

/**
 * This handler provider compleition item resolution capability. This provides
 * additional information for the currently compeltion item selection
 */
connection.onCompletionResolve(
  (item: CompletionItem): CompletionItem => {
    try {
      const token = item.data as Maybe<Token>;

      if (!empty(token)) {
      }

      return item;
    } catch (err) {
      if (err instanceof Error) {
        connection.console.error(`${err.message} ${err.stack}`);
      }

      return item;
    }
  },
);

const getDocumentSettings = (): Thenable<IClientConfiguration> => {
  if (!server.clientCapability.hasConfiguration) {
    return Promise.resolve(defaultClientConfiguration);
  }

  return connection.workspace.getConfiguration({
    scopeUri: server.workspaceUri,
    section: serverName,
  });
};

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
