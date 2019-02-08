/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import { ExtensionContext } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('server', 'out', 'server.js'),
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's
  // Inspector mode so VS Code can attach to the server for debugging

  // '--harmony_async_iteration'
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
  const runOptions = { execArgv: [] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: runOptions,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents
    documentSelector: [{ scheme: 'file', language: 'kos' }],
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'kosServer',
    'KOS Language Server',
    serverOptions,
    clientOptions,
  );

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate(): Thenable<void> {
  if (!client) {
    return new Promise(() => { return; });
  }
  return client.stop();
}
