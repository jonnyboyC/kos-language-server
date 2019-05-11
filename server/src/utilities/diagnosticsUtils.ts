import {
  Diagnostic, DiagnosticSeverity,
  DiagnosticRelatedInformation,
  Range,
} from 'vscode-languageserver';
import { languageServer } from './constants';

/**
 * This provides thin wrapper around Diagnostic.create where the server name is already included
 * @param range range the diagnostics applies
 * @param message message for the diagnostic
 * @param severity severity of the diagnostic
 * @param code error code
 * @param relatedInformation other related information
 */
export const createDiagnostic = (
  range: Range,
  message: string,
  severity?: DiagnosticSeverity,
  code?: number | string,
  relatedInformation?: DiagnosticRelatedInformation[]): Diagnostic => {
  return Diagnostic.create(range, message, severity, code, languageServer, relatedInformation);
};
