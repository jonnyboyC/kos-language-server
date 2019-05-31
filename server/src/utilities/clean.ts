import {
  Range,
  DiagnosticRelatedInformation,
  Location,
  Diagnostic,
  CompletionItem,
  MarkupContent,
  TextEdit,
  Command,
  Hover,
  Position,
} from 'vscode-languageserver';
import { TokenBase } from '../entities/types';
import { Token } from '../entities/token';

export const cleanCompletion = (completion: CompletionItem): CompletionItem => {
  return {
    label: completion.label,
    kind: completion.kind,
    detail: completion.detail,
    documentation:
      typeof completion.documentation === 'object'
        ? cleanMarkup(completion.documentation)
        : completion.documentation,
    deprecated: completion.deprecated,
    preselect: completion.preselect,
    sortText: completion.sortText,
    filterText: completion.filterText,
    insertText: completion.insertText,
    insertTextFormat: completion.insertTextFormat,
    textEdit: completion.textEdit,
    additionalTextEdits:
      completion.additionalTextEdits &&
      completion.additionalTextEdits.map(edit => cleanTextEdit(edit)),
    commitCharacters: completion.commitCharacters,
    command: completion.command && cleanCommand(completion.command),
    data: completion.data,
  };
};

export const cleanToken = (token: Token): TokenBase => {
  return {
    tag: 'token',
    type: token.type,
    lexeme: token.lexeme,
    literal: token.literal,
    start: cleanPosition(token.start),
    end: cleanPosition(token.end),
    uri: token.uri,
    typeString: token.typeString,
    range: cleanRange(token.range),
  };
};

export const cleanHover = (hover: Hover): Hover => {
  return {
    contents: hover.contents,
    range: hover.range && cleanRange(hover.range),
  };
};

export const cleanMarkup = (markup: MarkupContent): MarkupContent => {
  return {
    kind: markup.kind,
    value: markup.value,
  };
};

export const cleanCommand = (command: Command): Command => {
  return {
    title: command.title,
    command: command.command,
    arguments: command.arguments && [...command.arguments],
  };
};

export const cleanTextEdit = (textEdit: TextEdit): TextEdit => {
  return {
    range: cleanRange(textEdit.range),
    newText: textEdit.newText,
  };
};

export const cleanDiagnostic = (diagnostics: Diagnostic): Diagnostic => {
  return {
    range: cleanRange(diagnostics.range),
    severity: diagnostics.severity,
    code: diagnostics.code,
    source: diagnostics.source,
    message: diagnostics.message,
    relatedInformation:
      diagnostics.relatedInformation &&
      diagnostics.relatedInformation.map(info => cleanRelatedInformation(info)),
  };
};

export const cleanRange = (range: Range): Range => {
  return {
    start: cleanPosition(range.start),
    end: cleanPosition(range.end),
  };
};

export const cleanPosition = (position: Position): Position => {
  return {
    line: position.line,
    character: position.character,
  };
};

export const cleanLocation = (location: Location): Location => {
  return {
    uri: location.uri,
    range: cleanRange(location.range),
  };
};

export const cleanRelatedInformation = (
  relatedInformation: DiagnosticRelatedInformation,
): DiagnosticRelatedInformation => {
  return {
    location: {
      uri: relatedInformation.location.uri,
      range: cleanRange(relatedInformation.location.range),
    },
    message: relatedInformation.message,
  };
};
