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
	TextDocumentPositionParams
} from 'vscode-languageserver';
import { Scanner } from './lib/scanner/scanner';
import { TokenInterface, SyntaxErrorInterface } from './lib/scanner/types';
import { Parser } from './lib/parser/parser';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments = new TextDocuments();
let workspaceFolder: string = '';

connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities;
    connection.console.log(`[Server(${process.pid}) ${capabilities}] Started and initialize received`);
    
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
            }
		}
	};
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
	// The validator creates diagnostics for all uppercase words length 2 and more
    let text = textDocument.getText();
    const scanner = new Scanner(text);
    const tokens = scanner.scanTokens();

    if (hasScanError(tokens)) {
        const diagnostics: Diagnostic[] = tokens.map(t => {
            return {
                severity: DiagnosticSeverity.Error,
                range: { start: t.start, end: t.end },
                message: t.message,
                source: 'kos-language-server'
            }
        });

        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
        return;
    }

    const parser = new Parser(tokens);
    const [, errors] = parser.parse();

	const diagnostics: Diagnostic[] = errors.map(e => {
		return {
			severity: DiagnosticSeverity.Error,
			range: { start: e.token.start, end: e.token.end },
			message: e.message,
			source: 'kos-language-server'
		}
	});

	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

const hasScanError = (tokens: TokenInterface[] | SyntaxErrorInterface[]): tokens is SyntaxErrorInterface[] => {
    return tokens[0].tag === 'syntaxError';
} 

connection.onDidChangeWatchedFiles(_change => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [];
	}
);

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			(item.detail = 'TypeScript details'),
				(item.documentation = 'TypeScript documentation');
		} else if (item.data === 2) {
			(item.detail = 'JavaScript details'),
				(item.documentation = 'JavaScript documentation');
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
