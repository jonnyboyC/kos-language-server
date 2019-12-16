import { KLS } from '../kls';
import {
  TextDocumentPositionParams,
  CompletionItemKind,
  CompletionItem,
  SymbolInformation,
  SymbolKind,
  IPCMessageReader,
  IPCMessageWriter,
  StreamMessageReader,
  StreamMessageWriter,
  MessageReader,
  MessageWriter,
  Diagnostic,
  DiagnosticSeverity,
  Position,
} from 'vscode-languageserver';
import { empty } from './typeGuards';
import { KsSymbolKind, KsSymbol, KsBaseSymbol } from '../analysis/types';
import { cleanLocation, cleanToken, cleanCompletion } from './clean';
import { CommanderStatic } from 'commander';
import { DiagnosticUri } from '../types';
import { mapper } from './mapper';
import * as Expr from '../parser/models/expr';
import { rangeContainsPos, rangeAfter } from './positionUtils';
import * as SuffixTerm from '../parser/models/suffixTerm';
import { IType } from '../typeChecker/types';
import { tokenTrackedType } from '../typeChecker/utilities/typeUtilities';
import { structureType } from '../typeChecker/ksTypes/primitives/structure';
import { IoKind } from '../services/IoService';
import { DIAGNOSTICS, createDiagnosticUri } from './diagnosticsUtils';
import { ParseError } from '../parser/models/parserError';

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
  ['lowercase', CaseKind.lowerCase],
  ['uppercase', CaseKind.upperCase],
  ['camelcase', CaseKind.camelCase],
  ['pascalcase', CaseKind.pascalCase],
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

const ioEntityMap = new Map([
  [IoKind.file, CompletionItemKind.File],
  [IoKind.directory, CompletionItemKind.Folder],
]);

/**
 * Map of io kind to completion kind
 */
export const ioEntityMapper = mapper(ioEntityMap, 'IoEntity');

const symbolCompletionMap = new Map([
  [KsSymbolKind.function, CompletionItemKind.Function],
  [KsSymbolKind.parameter, CompletionItemKind.Variable],
  [KsSymbolKind.lock, CompletionItemKind.Property],
  [KsSymbolKind.variable, CompletionItemKind.Variable],
]);

/**
 * Map a ks symbol kind to a completion kind
 */
const symbolCompletionMapper = mapper(symbolCompletionMap, 'KsSymbolKind');

const symbolSymbolMap = new Map([
  [KsSymbolKind.function, SymbolKind.Function],
  [KsSymbolKind.parameter, SymbolKind.Variable],
  [KsSymbolKind.lock, SymbolKind.Object],
  [KsSymbolKind.variable, SymbolKind.Variable],
]);

/**
 * Map a ks symbol kind to a lang-server symbol kind
 */
const symbolSymbolMapper = mapper(symbolSymbolMap, 'KsSymbolKind');

/**
 * Get a list of all symbols currently in scope at the given line
 * @param analyzer analyzer instance
 * @param documentPosition the current position in the document
 * @param keywordCompletions a list of keywords to always concat
 */
export const symbolCompletionItems = async (
  analyzer: KLS,
  documentPosition: TextDocumentPositionParams,
  keywordCompletions: CompletionItem[],
): Promise<CompletionItem[]> => {
  const { position } = documentPosition;
  const { uri } = documentPosition.textDocument;

  // get all symbols currently in scope
  const localSymbols = await analyzer.getScopedSymbols(position, uri);
  const importedSymbols = await analyzer.getImportedSymbols(uri);

  const sortString = (priority: number, label: string) => `${priority}${label}`;
  const locals = sortString.bind(null, 0);
  const imports = sortString.bind(null, 1);

  const toCompletion = (
    sortLabel: (label: string) => string,
    entity: KsBaseSymbol,
  ): CompletionItem => {
    const kind = symbolCompletionMapper(entity.tag);

    let typeString = 'structure';
    const { tracker } = entity.name;
    if (!empty(tracker)) {
      const type = tracker.getType({ uri, range: entity.name });

      if (!empty(type)) {
        typeString = type.toString();
      }
    }

    return {
      kind,
      label: entity.name.lexeme,
      sortText: sortLabel(entity.name.lexeme),
      detail: `${entity.name.lexeme}: ${typeString}`,
      data: cleanToken(entity.name),
    } as CompletionItem;
  };

  const localCompletions = toCompletion.bind(null, locals);
  const importedCompletions = toCompletion.bind(null, imports);

  // generate completions
  return localSymbols
    .map(localCompletions)
    .concat(importedSymbols.map(importedCompletions))
    .concat(keywordCompletions)
    .map(completion => cleanCompletion(completion));
};

/**
 * Get a list of all known suffixes give a suffix completion trigger
 * @param analyzer analyzer instance
 * @param documentPosition the current position in the document
 */
export const suffixCompletionItems = async (
  analyzer: KLS,
  documentPosition: TextDocumentPositionParams,
): Promise<CompletionItem[]> => {
  const { position } = documentPosition;
  const { uri } = documentPosition.textDocument;

  // find suffix context
  const findResult = await analyzer.findToken(position, uri, Expr.Suffix);

  if (empty(findResult) || !(findResult.node instanceof Expr.Suffix)) {
    return [];
  }

  const suffixResult = findContainingSuffixTerm(findResult.node, position);
  if (empty(suffixResult)) {
    return [];
  }

  const type = resolveSuffixTermType(suffixResult.parentSuffixTerm);

  // if type not found exit
  if (empty(type)) {
    return [];
  }

  // get all suffixes on the predicted type
  const suffixes = [
    ...type
      .assignmentType()
      .suffixes()
      .values(),
  ];

  // generate completions
  return suffixes.map(suffix => ({
    kind: empty(suffix.callSignature())
      ? CompletionItemKind.Property
      : CompletionItemKind.Method,
    label: suffix.name,
    detail: `${suffix.name}: ${suffix.toString()}`,
  }));
};

const resolveSuffixTermType = (
  suffixTerm: SuffixTerm.SuffixTerm,
): Maybe<IType> => {
  const { atom } = suffixTerm;
  let type: Maybe<IType>;

  if (atom instanceof SuffixTerm.Literal) {
    type = tokenTrackedType(atom.token);
  } else if (atom instanceof SuffixTerm.Identifier) {
    type = tokenTrackedType(atom.token);
  } else if (atom instanceof SuffixTerm.Grouping) {
    type = tokenTrackedType(atom.open);
  } else {
    type = structureType;
  }

  return type;
};

const findContainingSuffixTerm = (
  suffix: Expr.Suffix,
  pos: Position,
): Maybe<FindSuffixTerm> => {
  if (empty(suffix.trailer) || rangeContainsPos(suffix.suffixTerm, pos)) {
    return undefined;
  }

  return findContainingSuffixTermTrailer(suffix, suffix.trailer, pos);
};

interface FindSuffixTerm {
  parentSuffixTerm: SuffixTerm.SuffixTerm;
  suffixTerm: SuffixTerm.SuffixTerm;
}

const findContainingSuffixTermTrailer = (
  parent: Expr.Suffix | SuffixTerm.SuffixTrailer,
  suffixTrailer: SuffixTerm.SuffixTrailer,
  pos: Position,
): Maybe<FindSuffixTerm> => {
  if (
    rangeContainsPos(suffixTrailer.suffixTerm, pos) ||
    rangeAfter(suffixTrailer.suffixTerm, pos)
  ) {
    return {
      parentSuffixTerm: parent.suffixTerm,
      suffixTerm: suffixTrailer.suffixTerm,
    };
  }

  if (!empty(suffixTrailer.trailer)) {
    return findContainingSuffixTermTrailer(
      suffixTrailer,
      suffixTrailer.trailer,
      pos,
    );
  }

  return undefined;
};

/**
 * Create lang server document symbols from ks symbols
 * @param analyzer analyzer instance
 * @param documentSymbol document identifier
 */
export const toDocumentSymbols = (
  entities: KsSymbol[],
  uri: string,
): Maybe<SymbolInformation[]> => {
  return entities.map(entity => {
    const kind: Maybe<SymbolKind> = symbolSymbolMapper(entity.tag);

    if (typeof entity.name === 'string') {
      throw new Error('Expected symbol tracker not type tracker');
    }

    return {
      kind,
      name: entity.name.lexeme,
      location: cleanLocation({
        uri: entity.name.uri || uri,
        range: entity.name,
      }),
      containerName: 'example',
    } as SymbolInformation;
  });
};

/**
 * Convert parser error to diagnostic
 * @param error parser error
 * @param uri uri string
 */
export const parseToDiagnostics = (error: ParseError, diagnostics: DiagnosticUri[] = []): DiagnosticUri[] => {
  diagnostics.push(createDiagnosticUri(
    error.token,
    error.message,
    DiagnosticSeverity.Error,
    DIAGNOSTICS.PARSER_ERROR,
  ));

  for (const inner of error.inner) {
    parseToDiagnostics(inner, diagnostics);
  }

  return diagnostics;
};

/**
 * convert resolver error to diagnostic
 * @param error diagnostic
 * @param uri uri string
 */
export const addDiagnosticsUri = (
  error: Diagnostic,
  uri: string,
): DiagnosticUri => {
  return { uri, ...error };
};
