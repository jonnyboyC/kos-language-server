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
  DocumentHighlight,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
  RenameParams,
  WorkspaceEdit,
  TextEdit,
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
  cleanRange,
} from './utilities/clean';
import { keywordCompletions } from './utilities/constants';
import { tokenTrackedType } from './typeChecker/typeUitlities';
import { Scanner } from './scanner/scanner';
import { isValidIdentifier } from './entities/tokentypes';
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
 * This handler provides document rename capabilites
 */
connection.onRenameRequest(
  ({ newName, textDocument, position }: RenameParams): Maybe<WorkspaceEdit> => {
    const scanner = new Scanner(newName);
    const { tokens, scanErrors } = scanner.scanTokens();

    // check if rename is valid
    if (
      scanErrors.length > 0 ||
      tokens.length !== 1 ||
      !isValidIdentifier(tokens[0].type)
    ) {
      return undefined;
    }

    const locations = kls.getUsageLocations(
      position,
      textDocument.uri,
    );
    if (empty(locations)) {
      return undefined;
    }
    const changes: PropType<WorkspaceEdit, 'changes'> = {};

    for (const location of locations) {
      if (!changes.hasOwnProperty(location.uri)) {
        changes[location.uri] = [];
      }

      changes[location.uri].push(TextEdit.replace(location.range, newName));
    }

    return { changes };
  },
);

/**
 * This handler provides document highlighting capability
 */
connection.onDocumentHighlight(
  (positionParams: TextDocumentPositionParams): DocumentHighlight[] => {
    const { position } = positionParams;
    const { uri } = positionParams.textDocument;

    const locations = kls.getFileUsageRanges(position, uri);
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

    const token = kls.getToken(position, uri);

    if (empty(token)) {
      return undefined;
    }

    const type = tokenTrackedType(token);

    const { tracker } = token;
    let label: string;
    let symbolKind: string;

    if (!empty(tracker)) {
      symbolKind = KsSymbolKind[tracker.declared.symbol.tag];

      label =
        tracker.kind === TrackerKind.basic
          ? tracker.declared.symbol.name.lexeme
          : tracker.declared.symbol.name;
    } else {
      symbolKind = 'literal';
      label = token.lexeme;
    }

    if (empty(type)) {
      return undefined;
    }

    return {
      contents: {
        // Note doesn't does do much other than format it as code
        // may look into adding type def syntax highlighting
        language: 'kos',
        value: `(${symbolKind}) ${label}: ${type.toTypeString()} `,
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
