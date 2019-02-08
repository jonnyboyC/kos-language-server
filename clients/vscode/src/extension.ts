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
  ForkOptions,
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

  const { version } = process;
  const [major] = version.slice(1)
    .split('.')
    .map(x => parseInt(x, 10));

  const debugOptions: ForkOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
  const runOptions: ForkOptions = { execArgv: [] };

  // async generators become default in node 10
  if (major < 10) {
    if (debugOptions.execArgv) debugOptions.execArgv.push('--harmony_async_iteration');
    if (runOptions.execArgv) runOptions.execArgv.push('--harmony_async_iteration');
  }

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
