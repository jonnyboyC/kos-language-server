if (Symbol['asyncIterator'] === undefined) {
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

import { createConnection, ProposedFeatures } from 'vscode-languageserver';
import { KLS } from './kls';
import { getConnectionPrimitives } from './utilities/serverUtils';
import { Logger } from './utilities/logger';
import { primitiveInitializer } from './typeChecker/types/primitives/initialize';
import { orbitalInitializer } from './typeChecker/types/orbital/initialize';
import { keywordCompletions } from './utilities/constants';
// tslint:disable-next-line:import-name
import program from 'commander';
import { ClientConfiguration, KLSConfiguration } from './types';

program
  .version('0.8.0', '-v --version')
  .option('--node-ipc', 'Connect with node inter process communication')
  .option('--stdio', 'Connect with standard io')
  .option('--clientProcessId', 'Id of the attached client process')
  .option(
    '--harmony_async_iteration',
    'Must be enabled if using node.js pre 10.0',
  )
  .parse(process.argv);

// get connection primitives based on command argument
const { reader, writer } = getConnectionPrimitives(program);

// Create a connection for the server. The connection uses Node's IPC or stdin and stdout
// Also include all preview / proposed LSP features.
export const connection = createConnection(
  ProposedFeatures.all,
  reader,
  writer,
);

// REMOVE ME TODO probably need to refactor the type modules as
// structure and the primitives have a dependency loop
primitiveInitializer();
orbitalInitializer();

// default client configuration
const defaultClientConfiguration: ClientConfiguration = {
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

// create default server options object
const defaultConfiguration: KLSConfiguration = {
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
};

const kls = new KLS(
  CaseKind.camelcase,
  new Logger(connection.console, LogLevel.info),
  connection.tracer,
  connection,
  defaultConfiguration,
);

kls.listen();
