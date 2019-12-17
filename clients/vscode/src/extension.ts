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
  Message,
  ErrorAction,
  CloseAction,
} from 'vscode-languageclient';
import {
  inspectorChannelProvider,
  channelRouter,
  vscodeChannelProvider,
} from './commands/channelRouterProvider';
import { telnetProvider } from './commands/telnetProvider';
import { kspProvider } from './commands/kspProvider';
import { searchDocumentationProvider } from './commands/searchDocumentationProvider';

let client: LanguageClient;

const env = process.env.NODE_ENV || 'dev';
const serverFolder = env === 'dev' ? 'out/src' : 'dist';

/**
 * This function activates the extension when vscode determines we've either opens a
 * kos file or run an associated command
 * @param context Current extension context
 */
export function activate(context: ExtensionContext) {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('server', serverFolder, 'server.js'),
  );

  // The language server debug options
  // --nolazy eagerly compiles the js files so they can be debug
  // --inspect=6009 says to run the server in inspector mode on port 6009
  const debugOptions: ForkOptions = {
    execArgv: ['--nolazy', '--inspect=6009'],
  };

  // The language server production options
  const runOptions: ForkOptions = { execArgv: [] };

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
    documentSelector: [
      { scheme: 'file', language: 'kos' },
      { scheme: 'file', language: 'json' },
    ],

    errorHandler: {
      error(error: Error, message: Message, count: number): ErrorAction {
        console.log(error);
        console.log(message);
        console.log(count);

        return ErrorAction.Continue;
      },
      closed(): CloseAction {
        return CloseAction.Restart;
      },
    },

    // Allow the websocket to be an output channel
    outputChannel: channelRouter,
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'kos-vscode',
    'KOS Language Server',
    serverOptions,
    clientOptions,
  );

  // Start the client. This will also launch the server
  client.start();

  // add provider to route output to vscode
  context.subscriptions.push(
    commands.registerCommand(
      vscodeChannelProvider.command,
      vscodeChannelProvider.commandCallback,
    ),
  );

  // add provider to route output to a websocket
  context.subscriptions.push(
    commands.registerCommand(
      inspectorChannelProvider.command,
      inspectorChannelProvider.commandCallback,
    ),
  );

  // add run provider to commands
  context.subscriptions.push(
    commands.registerCommand(
      telnetProvider.command,
      telnetProvider.commandCallback,
    ),
  );

  // add start provider to commands
  context.subscriptions.push(
    commands.registerCommand(kspProvider.command, kspProvider.commandCallback),
  );

  // add search documentation command
  context.subscriptions.push(
    commands.registerCommand(
      searchDocumentationProvider.command,
      searchDocumentationProvider.commandCallback,
    ),
  );
}

/**
 * This function is executed when vscode determines the extension no longer
 * need to be activated or was requested by the user
 */
export function deactivate(): Thenable<void> {
  if (!client) {
    return new Promise(() => {
      return;
    });
  }

  // call lsp client stop method
  return client.stop();
}
