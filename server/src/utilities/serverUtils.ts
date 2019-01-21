import { Analyzer } from '../analyzer';
import {
  TextDocumentPositionParams,
  CompletionItemKind,
  CompletionItem,
} from 'vscode-languageserver';

export const entityCompletionItems = (
  analyzer: Analyzer,
  documentPosition: TextDocumentPositionParams): CompletionItem[] => {

  const { position } = documentPosition;
  const { uri } = documentPosition.textDocument;

  const entities = analyzer.getScopedEntities(position, uri);
  return entities.map((entity) => {
    let kind: Maybe<CompletionItemKind> = undefined;
    switch (entity.tag) {
      case 'function':
        kind = CompletionItemKind.Function;
        break;
      case 'parameter':
        kind = CompletionItemKind.Variable;
        break;
      case 'lock':
        kind = CompletionItemKind.Variable;
        break;
      case 'variable':
        kind = CompletionItemKind.Variable;
        break;
      default:
        throw new Error('Unknown entity type');
    }

    return {
      kind,
      label: entity.name.lexeme,
      data: entity,
    } as CompletionItem;
  });
};

export const suffixCompletionItems = (
  analyzer: Analyzer,
  documentPosition: TextDocumentPositionParams): CompletionItem[] => {

  const { position } = documentPosition;
  const { uri } = documentPosition.textDocument;

  if (analyzer) {
    console.log(position);
    console.log(uri);
  }

  return [{
    kind: CompletionItemKind.Enum,
    label: 'cat',
  }];
};
