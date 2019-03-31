/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import { ExtensionContext, commands } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  ForkOptions,
} from 'vscode-languageclient';
import { telnetProvider } from './commands/telnetProvider';
import { kspProvider } from './commands/kspProvider';

let client: LanguageClient;

/**
 * This function activates the extension when vscode determines we've either opens a
 * kos file or run an associated command
 * @param context Current extension context
 */
export function activate(context: ExtensionContext) {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('server', 'out', 'server.js'),
  );

  // determine the major version of the bundled node process
  const { version } = process;
  const [major] = version.slice(1)
    .split('.')
    .map(x => parseInt(x, 10));

  // The language server debug options
  // --nolazy eagerly compiles the js files so they can be debug
  // --inspect=6009 says to run the server in inspector mode on port 6009
  const debugOptions: ForkOptions = { execArgv: ['--prof', '--nolazy', '--inspect=6009'] };

  // The language server production options
  const runOptions: ForkOptions = { execArgv: ['--prof'] };

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
    // Register the server for kos documents
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

  // add run provider to commands
  context.subscriptions.push(
    commands.registerCommand(telnetProvider.command, telnetProvider.commandCallback));

  // add start provider to commands
  context.subscriptions.push(
    commands.registerCommand(kspProvider.command, kspProvider.commandCallback));
}

/**
 * This function is executed when vscode determines the extension no longer
 * need to be activated or was requested by the user
 */
export function deactivate(): Thenable<void> {
  if (!client) {
    return new Promise(() => { return; });
  }

  // call lsp client stop method
  return client.stop();
}
