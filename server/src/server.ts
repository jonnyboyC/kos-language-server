if (Symbol['asyncIterator'] === undefined) {
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

import { createConnection, ProposedFeatures } from 'vscode-languageserver';
import { KLS } from './kls';
import { getConnectionPrimitives } from './utilities/serverUtils';
import { Logger } from './models/logger';
// tslint:disable-next-line:import-name
import program from 'commander';
import { typeInitializer } from './typeChecker/initialize';
import { defaultWorkspaceConfiguration } from './config/models/workspaceConfiguration';
import { defaultServerConfiguration } from './config/models/serverConfiguration';
import packageJson from '../package.json';

const defaultVersion = '1.0.0';
const version = packageJson?.version ?? defaultVersion;

program
  .version(version, '-v --version')
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
typeInitializer();
const logger = new Logger(connection.console, LogLevel.info);

const kls = new KLS(
  CaseKind.camelCase,
  logger,
  connection.tracer,
  connection,
  version,
  defaultServerConfiguration,
  defaultWorkspaceConfiguration,
);

kls.listen();
