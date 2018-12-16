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
    Location
} from 'vscode-languageserver';
import { Scanner } from './lib/scanner/scanner';
import { ISyntaxError } from './lib/scanner/types';
import { Parser } from './lib/parser/parser';
import { IParseError } from './lib/parser/types';
import { Resolver } from './lib/analysis/resolver';
import { IResolverError } from './lib/analysis/types';
import { ScopeManager } from './lib/analysis/scopeManager';
import { FuncResolver } from './lib/analysis/functionResolver';
import { IToken } from './lib/entities/types';
import { empty } from './lib/utilities/typeGuards';
import { fileInsts } from './lib/entities/fileInsts';
import { TokenManager } from './lib/scanner/tokenManager';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
export const connection = createConnection(ProposedFeatures.all);

interface IDocumentInfo {
    tokenManager?: TokenManager;
    syntaxTree?: fileInsts;
    scopeManager?: ScopeManager;
}


// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments = new TextDocuments();
let workspaceFolder: string = '';
const scopeMap: Map<string, IDocumentInfo> = new Map();

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;
	connection.console.log(`[Server(${process.pid}) ${JSON.stringify(capabilities)}] Started and initialize received`);
	
	if (params.rootUri) {
			workspaceFolder = params.rootUri;
	}
	connection.console.log(`[Server(${process.pid}) ${workspaceFolder}] Started and initialize received`);

	return {
		capabilities: {
			textDocumentSync: documents.syncKind,
			// Tell the client that the server supports code completion
			completionProvider: {
                resolveProvider: true,
                triggerCharacters: [ ':' ]
            },
            signatureHelpProvider: {
                triggerCharacters: [ '(' ]
            },
            definitionProvider: true,
		}
	};
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

// convert scan error to diagnostic
const scanToDiagnostics = (error: ISyntaxError): Diagnostic => {
	return {
		severity: DiagnosticSeverity.Error,
		range: { start: error.start, end: error.end },
		message: error.message,
		source: 'kos-language-server'
	}
}

// convert parse error to diagnostic
const parseToDiagnostics = (error: IParseError): Diagnostic => {
	return {
		severity: DiagnosticSeverity.Error,
		range: { start: error.token.start, end: error.token.end },
		message: error.message,
		source: 'kos-language-server'
	}
}

// convert resolver error to diagnostic
const resolverToDiagnostics = (error: IResolverError): Diagnostic => {
	return {
		severity: DiagnosticSeverity.Warning,
		range: { start: error.token.start, end: error.token.end },
		message: error.message,
		source: 'kos-language-server'
	}
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// The validator creates diagnostics for all uppercase words length 2 and more
    let text = textDocument.getText();

	connection.console.log('');
	connection.console.log(`Scanning ${textDocument.uri}`);
	const scanner = new Scanner(text);
	const tokens = scanner.scanTokens();

	// if scanner found errors report those immediately
	if (hasScanError(tokens)) {
		const diagnostics: Diagnostic[] = tokens
			.map(error => scanToDiagnostics(error));

		connection.console.log(`Scanning encountered ${diagnostics.length} errors bailing.`)
		connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
		return;
    }
    
    const tokenManager = new TokenManager(tokens);

	// parse scanned tokens
	connection.console.log(`Parsing ${textDocument.uri}`)
	const parser = new Parser(tokens);
	const [fileInsts, errors] = parser.parse();

	// generate new parser errors
	let diagnostics: Diagnostic[] = []
	
	if (errors.length > 0) {
		errors.map(error => [
			parseToDiagnostics(error), 
			...error.inner.map(innerError => parseToDiagnostics(innerError))
		])
		.reduce((acc, current) => acc.concat(current))
		connection.console.log(`Parser encountered ${errors}.`)
	}

	// generate a scope manager for resolving
	const scopeManager = new ScopeManager();
	
	// generate resolvers
	const funcResolver = new FuncResolver(fileInsts, scopeManager); 
	const resolver = new Resolver(fileInsts, scopeManager);
	
	// resolve the rest of the script
	connection.console.log(`Function resolving ${textDocument.uri}`);
	const funcErrors = funcResolver.resolve();
	
	// perform an initial function pass
	connection.console.log(`Resolving ${textDocument.uri}`)
	const resolverErrors = resolver.resolve();

	diagnostics = diagnostics.concat(resolverErrors
		.concat(funcErrors)
		.map(error => resolverToDiagnostics(error)));

	scopeMap.set(textDocument.uri, {
        tokenManager: tokenManager,
        syntaxTree: fileInsts,
        scopeManager: scopeManager
    });
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

const hasScanError = (tokens: IToken[] | ISyntaxError[]): tokens is ISyntaxError[] => {
    return tokens[0].tag === 'syntaxError';
} 

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

connection.onDefinition(
    (documentPosition: TextDocumentPositionParams): Maybe<Location> => {
		const { position } = documentPosition;
		const { uri } = documentPosition.textDocument;

        const documentInfo = scopeMap.get(uri);
        if (empty(documentInfo) || empty(documentInfo.scopeManager) || empty(documentInfo.tokenManager)) {
            return undefined;
        }

        const { scopeManager, tokenManager } = documentInfo;
        const token = tokenManager.find(position);

        if (empty(token)) {
            return undefined;
        }

        const entity = scopeManager.entityAtPosition(position, token.lexeme);
        if (empty(entity)) {
            return undefined;
        }

        return Location.create(uri, entity.name)
    }
);

connection.onSignatureHelp(
    (documentPosition: TextDocumentPositionParams): SignatureHelp => {
        // const { position } = documentPosition;
		const { uri } = documentPosition.textDocument;

		const scopeManager = scopeMap.get(uri);

		if (!empty(scopeManager)) {
            
        }

        return {
            signatures: [],
            activeParameter: null,
            activeSignature: null,
        };
    }
);

// This handler provides the inentitiesAtPositionitial list of the completion items.
connection.onCompletion(
	(documentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.

		const { position } = documentPosition;
		const { uri } = documentPosition.textDocument;
		const completionItems: CompletionItem[] = []

		const documentInfo = scopeMap.get(uri);

		if (!empty(documentInfo) && !empty(documentInfo.scopeManager)) {
			const entities = documentInfo.scopeManager
				.entitiesAtPosition(position);
			
			return completionItems.concat(
				entities.map(entity => {
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
						label: entity.name.lexeme,
						kind,
						data: entity,
					};
				})
			);
		}

		return completionItems;
	}
);

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		// this would be a possible spot to pull in doc string if present.
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
