import { KLS } from '../kls';
import {
  TextDocumentPositionParams,
  CompletionItemKind,
  CompletionItem,
  DocumentSymbolParams,
  SymbolInformation,
  SymbolKind,
  IPCMessageReader,
  IPCMessageWriter,
  StreamMessageReader,
  StreamMessageWriter,
  MessageReader,
  MessageWriter,
  SignatureHelp,
} from 'vscode-languageserver';
import { empty } from './typeGuards';
import { allSuffixes, tokenTrackedType } from '../typeChecker/typeUitlities';
import { KsSymbolKind } from '../analysis/types';
import { cleanLocation, cleanToken, cleanCompletion } from './clean';
import { CallKind } from '../typeChecker/types';
import { CommanderStatic } from 'commander';
import { ClientConfiguration } from '../types';
import { mapper } from './mapper';

/**
 * The default client configuration if none are available
 */
export const defaultClientConfiguration: ClientConfiguration = {
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

/**
 * Get the connection primitives based on the request connection type
 * @param connectionType connection type
 */
export const getConnectionPrimitives = (
  program: CommanderStatic,
): { writer: MessageWriter; reader: MessageReader } => {

  let reader: MessageReader;
  let writer: MessageWriter;

  if (program.nodeIpc) {
    reader = new IPCMessageReader(process);
    writer = new IPCMessageWriter(process);
  } else {
    reader = new StreamMessageReader(process.stdin);
    writer = new StreamMessageWriter(process.stdout);
  }

  writer.onError(([error, message, code]) => {
    console.log(error);
    console.log(message);
    console.log(code);
  });

  reader.onError(error => {
    console.log(error);
  });

  return {
    reader,
    writer,
  };
};

const caseMap = new Map([
  ['lowercase', CaseKind.lowercase],
  ['uppercase', CaseKind.uppercase],
  ['camelcase', CaseKind.camelcase],
  ['pascalcase', CaseKind.pascalcase],
]);

/**
 * Map a string to a case kind
 */
export const caseMapper = mapper(caseMap, 'CaseKind');

const logMap = new Map([
  ['verbose', LogLevel.verbose],
  ['info', LogLevel.info],
  ['log', LogLevel.log],
  ['warn', LogLevel.warn],
  ['error', LogLevel.error],
  ['none', LogLevel.none],
]);

/**
 * Map a string to a log level
 */
export const logMapper = mapper(logMap, 'LogLevel');

const symbolMap = new Map([
  [KsSymbolKind.function, CompletionItemKind.Function],
  [KsSymbolKind.parameter, CompletionItemKind.Variable],
  [KsSymbolKind.lock, CompletionItemKind.Reference],
  [KsSymbolKind.variable, CompletionItemKind.Variable],
]);

/**
 * Map a ks symbol kind to a completion kind
 */
export const symbolMapper = mapper(symbolMap, 'KsSymbolKind');

const callMap = new Map([
  [CallKind.call, CompletionItemKind.Method],
  [CallKind.optionalCall, CompletionItemKind.Method],
  [CallKind.get, CompletionItemKind.Property],
  [CallKind.set, CompletionItemKind.Property],
]);

/**
 * Map a ks call kind to a completion kind
 */
export const callMapper = mapper(callMap, 'CallKind');

/**
 * Get a list of all symbols currently in scope at the given line
 * @param analyzer analyzer instance
 * @param documentPosition the current position in the document
 * @param keywordCompletions a list of keywords to always concat
 */
export const symbolCompletionItems = (
  analyzer: KLS,
  documentPosition: TextDocumentPositionParams,
  keywordCompletions: CompletionItem[],
): CompletionItem[] => {
  const { position } = documentPosition;
  const { uri } = documentPosition.textDocument;

  // get all symbols currently in scope
  const entities = analyzer.getScopedSymbols(position, uri);

  // generate completions
  return entities
    .map(entity => {
      const kind = symbolMapper(entity.tag);

      let typeString = 'structure';
      const { tracker } = entity.name;
      if (!empty(tracker)) {
        const type = tracker.getType({ uri, range: entity.name });

        if (!empty(type)) {
          typeString = type.toTypeString();
        }
      }

      return {
        kind,
        label: entity.name.lexeme,
        detail: `${entity.name.lexeme}: ${typeString}`,
        data: cleanToken(entity.name),
      } as CompletionItem;
    })
    .concat(keywordCompletions)
    .map(completion => cleanCompletion(completion));
};

/**
 * Get a list of all known suffixes give a suffix completion trigger
 * @param analyzer analyzer instance
 * @param documentPosition the current position in the document
 */
export const suffixCompletionItems = (
  analyzer: KLS,
  documentPosition: TextDocumentPositionParams,
): CompletionItem[] => {
  const { position } = documentPosition;
  const { uri } = documentPosition.textDocument;

  // TODO more robust method
  const token = analyzer.getToken(
    { line: position.line, character: position.character - 2 },
    uri,
  );

  if (empty(token)) {
    return [];
  }

  const type = tokenTrackedType(token);

  // if type not found exit
  if (empty(type)) {
    return [];
  }

  // get all suffixes on the predicted type
  const suffixes = allSuffixes(type);

  // generate completions
  return suffixes.map(suffix => ({
    kind: callMapper(suffix.callType),
    label: suffix.name,
    detail: `${suffix.name}: ${suffix.toTypeString()}`,
  }));
};

/**
 * Get all symbols in the current document
 * @param analyzer analyzer instance
 * @param documentSymbol document identifier
 */
export const documentSymbols = (
  analyzer: KLS,
  documentSymbol: DocumentSymbolParams,
): Maybe<SymbolInformation[]> => {
  const { uri } = documentSymbol.textDocument;

  const entities = analyzer.getAllFileSymbols(uri);
  return entities.map(entity => {
    let kind: Maybe<SymbolKind> = undefined;
    switch (entity.tag) {
      case KsSymbolKind.function:
        kind = SymbolKind.Function;
        break;
      case KsSymbolKind.parameter:
        kind = SymbolKind.Variable;
        break;
      case KsSymbolKind.lock:
        kind = SymbolKind.Object;
        break;
      case KsSymbolKind.variable:
        kind = SymbolKind.Variable;
        break;
      default:
        throw new Error('Unknown symbol type');
    }

    return {
      kind,
      name: entity.name.lexeme,
      location: cleanLocation({
        uri: entity.name.uri || uri,
        range: entity.name,
      }),
    } as SymbolInformation;
  });
};

/**
 * The default signature if non can be provided
 */
export const defaultSignature = (): SignatureHelp => ({
  signatures: [],
  activeParameter: null,
  activeSignature: null,
});
