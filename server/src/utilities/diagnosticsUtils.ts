import {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticRelatedInformation,
  Range,
} from 'vscode-languageserver';
import { languageServer } from './constants';

/**
 * This provides thin wrapper around Diagnostic.create where the server name is already included
 * @param range range the diagnostics applies
 * @param message message for the diagnostic
 * @param severity severity of the diagnostic
 * @param code error code for the diagnostic
 * @param relatedInformation other related information
 */
export const createDiagnostic = (
  range: Range,
  message: string,
  severity: DiagnosticSeverity,
  code: ValueOf<typeof DIAGNOSTICS> | ValueOf<typeof CONFIG_DIAGNOSTICS>,
  relatedInformation?: DiagnosticRelatedInformation[],
): Diagnostic => {
  return Diagnostic.create(
    range,
    message,
    severity,
    code,
    languageServer,
    relatedInformation,
  );
};

/**
 * Code for each diagnostic in the language server
 */
export const DIAGNOSTICS = {
  // scanner
  SCANNER_ERROR: 'scanner-error',

  // parser
  PARSER_ERROR: 'parser-error',

  // analysis service
  LOAD_ERROR: 'unable-to-load-file',

  // flow analysis
  UNREACHABLE_CODE: 'unreachable-code',

  // resolver
  GLOBAL_PARAMETER: 'global-parameter',
  INVALID_LAZY_GLOBAL: 'invalid-lazy-global',
  INVALID_RETURN_CONTEXT: 'invalid-return-context',
  INVALID_PRESERVE_CONTEXT: 'invalid-preserve-context',
  INVALID_BREAK_CONTEXT: 'invalid-break-context',
  COPY_DEPRECATED: 'copy-deprecated',
  RENAME_DEPRECATED: 'rename-deprecated',
  DELETE_DEPRECATED: 'delete-deprecated',
  UNINITIALIZED_SET: 'uninitialized-set',

  // symbol table
  SYMBOL_MAY_NOT_EXIST: 'symbol-may-not-exist',
  SYMBOL_MAY_NOT_RUNTIME_EXIST: 'symbol-may-not-runtime-exist',
  SYMBOL_WRONG_KIND: 'symbol-wrong-kind',
  SYMBOL_UNUSED_LOCALLY: 'symbol-unused-locally',
  SYMBOL_UNUSED: 'symbol-unused',
  SYMBOL_SHADOWS: 'symbol-shadows',
  SYMBOL_CONFLICT: 'symbol-conflict',

  // type checker
  TYPE_WRONG: 'type-wrong',
  TYPE_NO_CALL: 'type-no-call',
  TYPE_WRONG_ARITY: 'type-wrong-arity',
  TYPE_LIST_INVALID: 'type-list-invalid',
  TYPE_NO_INDEXER: 'type-no-indexer',
  TYPE_NOT_FUNCTION: 'type-not-function',
  TYPE_MISSING_SUFFIX: 'type-missing-suffix',
  TYPE_MISSING_OPERATOR: 'type-missing-operator',
  TYPE_NO_SETTER: 'type-no-setter',
} as const;

/**
 * Code for each diagnostic in `ksconfig.json`
 */
export const CONFIG_DIAGNOSTICS = {
  INVALID_PROPERTY: 'invalid-property',
  INVALID_VALUE: 'invalid-value',
} as const;
