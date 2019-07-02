if (Symbol['asyncIterator'] === undefined) {
  (Symbol as any)['asyncIterator'] = Symbol.for('asyncIterator');
}

import {
  createConnection,
  ProposedFeatures,
  TextDocumentPositionParams,
  Location,
  DocumentSymbolParams,
  SymbolInformation,
  ReferenceParams,
  Hover,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
} from 'vscode-languageserver';
import { empty } from './utilities/typeGuards';
import { KLS } from './kls';
import { KsSymbolKind, TrackerKind } from './analysis/types';
import {
  documentSymbols,
  getConnectionPrimitives,
} from './utilities/serverUtils';
import { Logger } from './utilities/logger';
import { primitiveInitializer } from './typeChecker/types/primitives/initialize';
import { orbitalInitializer } from './typeChecker/types/orbital/initialize';
import {
  cleanLocation,
  cleanPosition,
} from './utilities/clean';
import { keywordCompletions } from './utilities/constants';
import { tokenTrackedType } from './typeChecker/typeUitlities';
import { TypeKind } from './typeChecker/types';
// tslint:disable-next-line:import-name
import program from 'commander';
import { ClientConfiguration, KLSConfiguration } from './types';

program
  .version('0.6.1', '-v --version')
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

// create server options object
const configuration: KLSConfiguration = {
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
  configuration,
);

/**
 * This handler provides the find all reference capability
 */
connection.onReferences(
  (referenceParams: ReferenceParams): Maybe<Location[]> => {
    const { position } = referenceParams;
    const { uri } = referenceParams.textDocument;

    const locations = kls.getUsageLocations(position, uri);
    return locations && locations.map(loc => cleanLocation(loc));
  },
);

// This handler provides signature help
connection.onSignatureHelp(
  (documentPosition: TextDocumentPositionParams): SignatureHelp => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    const result = kls.getFunctionAtPosition(position, uri);
    if (empty(result)) return defaultSignature();
    const { tracker, index } = result;

    let label =
      typeof tracker.declared.symbol.name === 'string'
        ? tracker.declared.symbol.name
        : tracker.declared.symbol.name.lexeme;

    const type = tracker.getType({
      uri,
      range: { start: position, end: position },
    });

    if (empty(type)) {
      return defaultSignature();
    }

    switch (type.kind) {
      case TypeKind.function:
      case TypeKind.suffix:
        let start = label.length + 1;
        const { params } = type;
        const paramInfos: ParameterInformation[] = [];

        // check if normal or variadic type
        if (Array.isArray(params)) {
          // generate normal labels
          if (params.length > 0) {
            const labels: string[] = [];
            for (let i = 0; i < params.length - 1; i += 1) {
              const paramLabel = `${params[i].toTypeString()}, `;
              paramInfos.push(
                ParameterInformation.create([
                  start,
                  start + paramLabel.length - 2,
                ]),
              );
              labels.push(paramLabel);
              start = start + paramLabel.length;
            }

            const paramLabel = `${params[params.length - 1].toTypeString()}`;
            paramInfos.push(
              ParameterInformation.create([start, start + paramLabel.length]),
            );
            labels.push(paramLabel);
            label = `${label}(${labels.join('')})`;
          }
        } else {
          // generate variadic labels
          const variadicLabel = params.toTypeString();
          paramInfos.push(
            ParameterInformation.create([start, start + variadicLabel.length]),
          );
          label = `${label}(${variadicLabel})`;
        }

        return {
          signatures: [
            SignatureInformation.create(label, undefined, ...paramInfos),
          ],
          activeParameter: index,
          activeSignature: null,
        };
      default:
        return defaultSignature();
    }
  },
);

/**
 * This handler provides document symbols capability
 */
connection.onDocumentSymbol(
  (documentSymbol: DocumentSymbolParams): Maybe<SymbolInformation[]> => {
    return documentSymbols(kls, documentSymbol);
  },
);

/**
 * This handler provides defintition capability
 */
connection.onDefinition(
  (documentPosition: TextDocumentPositionParams): Maybe<Location> => {
    const { position } = documentPosition;
    const { uri } = documentPosition.textDocument;

    const location = kls.getDeclarationLocation(position, uri);
    return location && cleanLocation(location);
  },
);

const defaultSignature = (): SignatureHelp => ({
  signatures: [],
  activeParameter: null,
  activeSignature: null,
});

// Listen on the connection
connection.listen();
