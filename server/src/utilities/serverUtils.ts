import { Analyzer } from '../analyzer';
import {
  TextDocumentPositionParams,
  CompletionItemKind,
  CompletionItem,
  DocumentSymbolParams,
  SymbolInformation,
  SymbolKind,
} from 'vscode-languageserver';
import { empty } from './typeGuards';
import { allSuffixes } from '../typeChecker/typeUitlities';
import { CallType } from '../typeChecker/types/types';
import { KsSymbolKind } from '../analysis/types';
import { cleanLocation, cleanToken, cleanCompletion } from './clean';
import { keywordCompletions } from './constants';

export const entityCompletionItems = (
  analyzer: Analyzer,
  documentPosition: TextDocumentPositionParams,
): CompletionItem[] => {
  const { position } = documentPosition;
  const { uri } = documentPosition.textDocument;

  const entities = analyzer.getScopedSymbols(position, uri);
  return entities
    .map((entity) => {
      let kind: Maybe<CompletionItemKind> = undefined;
      switch (entity.tag) {
        case KsSymbolKind.function:
          kind = CompletionItemKind.Function;
          break;
        case KsSymbolKind.parameter:
          kind = CompletionItemKind.Variable;
          break;
        case KsSymbolKind.lock:
          kind = CompletionItemKind.Variable;
          break;
        case KsSymbolKind.variable:
          kind = CompletionItemKind.Variable;
          break;
        default:
          throw new Error('Unknown entity type');
      }

      return {
        kind,
        label: entity.name.lexeme,
        data: cleanToken(entity.name),
      } as CompletionItem;
    })
    .concat(keywordCompletions)
    .map(completion => cleanCompletion(completion));
};

export const suffixCompletionItems = (
  analyzer: Analyzer,
  documentPosition: TextDocumentPositionParams,
): CompletionItem[] => {
  const { position } = documentPosition;
  const { uri } = documentPosition.textDocument;

  const token = analyzer.getToken(position, uri);
  const typeInfo = analyzer.getSuffixType(position, uri);
  if (empty(token) || empty(typeInfo)) {
    return [];
  }
  const [type] = typeInfo;
  const suffixes = allSuffixes(type);

  return suffixes.map((suffix) => {
    switch (suffix.callType) {
      case CallType.call:
      case CallType.optionalCall:
        return {
          kind: CompletionItemKind.Method,
          label: suffix.name,
          details: suffix.toTypeString(),
        } as CompletionItem;
      case CallType.get:
      case CallType.set:
        return {
          kind: CompletionItemKind.Property,
          label: suffix.name,
          details: suffix.toTypeString(),
        } as CompletionItem;
      default:
        throw new Error('Unanticipated call type found');
    }
  });
};

export const documentSymbols = (
  analyzer: Analyzer,
  documentSymbol: DocumentSymbolParams,
): Maybe<SymbolInformation[]> => {
  const { uri } = documentSymbol.textDocument;

  const entities = analyzer.getAllFileSymbols(uri);
  return entities.map((entity) => {
    let kind: Maybe<SymbolKind> = undefined;
    switch (entity.tag) {
      case KsSymbolKind.function:
        kind = SymbolKind.Function;
        break;
      case KsSymbolKind.parameter:
        kind = SymbolKind.Variable;
        break;
      case KsSymbolKind.lock:
        kind = SymbolKind.Variable;
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
