import { Analyzer } from '../analyzer';
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
} from 'vscode-languageserver';
import { empty } from './typeGuards';
import { allSuffixes, tokenTrackedType } from '../typeChecker/typeUitlities';
import { CallType } from '../typeChecker/types/types';
import { KsSymbolKind } from '../analysis/types';
import { cleanLocation, cleanToken, cleanCompletion } from './clean';
import { IServer } from '../server';
import { keywordCompletions } from './constants';

/**
 * Get the connection primitives based on the request connection type
 * @param connectionType connection type
 */
export const getConnectionPrimitives = (
  connectionType: string,
): { writer: MessageWriter; reader: MessageReader } => {
  let reader: MessageReader;
  let writer: MessageWriter;

  switch (connectionType) {
    case '--node-ipc':
      reader = new IPCMessageReader(process);
      writer = new IPCMessageWriter(process);
      break;
    case '--stdio':
      reader = new StreamMessageReader(process.stdin);
      writer = new StreamMessageWriter(process.stdout);
      break;
    default:
      throw new Error('');
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

/**
 * Get the connection primitives based on the request connection type
 * @param connectionType connection type
 */
export const updateServer = (server: IServer): void => {
  const { clientConfig } = server;

  let caseKind: CaseKind = CaseKind.camelcase;
  switch (clientConfig.completionCase) {
    case 'lowercase':
      caseKind = CaseKind.lowercase;
      break;
    case 'uppercase':
      caseKind = CaseKind.uppercase;
      break;
    case 'camelcase':
      caseKind = CaseKind.camelcase;
      break;
    case 'pascalcase':
      caseKind = CaseKind.pascalcase;
      break;
  }

  let logLevel: LogLevel = LogLevel.error;
  switch (clientConfig.trace.server.level) {
    case 'verbose':
      logLevel = LogLevel.verbose;
      break;
    case 'info':
      logLevel = LogLevel.info;
      break;
    case 'log':
      logLevel = LogLevel.info;
      break;
    case 'warn':
      logLevel = LogLevel.warn;
      break;
    case 'error':
      logLevel = LogLevel.error;
      break;
    case 'none':
      logLevel = LogLevel.none;
      break;
  }

  server.keywords = keywordCompletions(caseKind);
  server.analyzer.logger.level = logLevel;
  server.analyzer.setCase(caseKind);
};

/**
 * Get a list of all symbols currently in scope at the given line
 * @param analyzer analyzer instance
 * @param documentPosition the current position in the document
 * @param keywordCompletions a list of keywords to always concat
 */
export const symbolCompletionItems = (
  analyzer: Analyzer,
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
      let kind: Maybe<CompletionItemKind> = undefined;
      switch (entity.tag) {
        case KsSymbolKind.function:
          kind = CompletionItemKind.Function;
          break;
        case KsSymbolKind.parameter:
          kind = CompletionItemKind.Variable;
          break;
        case KsSymbolKind.lock:
          kind = CompletionItemKind.Reference;
          break;
        case KsSymbolKind.variable:
          kind = CompletionItemKind.Variable;
          break;
        default:
          throw new Error('Unknown entity type');
      }

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
  analyzer: Analyzer,
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
  return suffixes.map(suffix => {
    switch (suffix.callType) {
      case CallType.call:
      case CallType.optionalCall:
        return {
          kind: CompletionItemKind.Method,
          label: suffix.name,
          detail: `${suffix.name}: ${suffix.toTypeString()}`,
        } as CompletionItem;
      case CallType.get:
      case CallType.set:
        return {
          kind: CompletionItemKind.Property,
          label: suffix.name,
          detail: `${suffix.name}: ${suffix.toTypeString()}`,
        } as CompletionItem;
      default:
        throw new Error('Unanticipated call type found');
    }
  });
};

/**
 * Get all symbols in the current document
 * @param analyzer analyzer instance
 * @param documentSymbol document identifier
 */
export const documentSymbols = (
  analyzer: Analyzer,
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
