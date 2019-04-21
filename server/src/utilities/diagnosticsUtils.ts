import {
  Diagnostic, DiagnosticSeverity,
  DiagnosticRelatedInformation,
  Range,
} from 'vscode-languageserver';
import { languageServer } from './constants';

export const createDiagnostic = (
  range: Range,
  message: string,
  severity?: DiagnosticSeverity,
  code?: number | string,
  relatedInformation?: DiagnosticRelatedInformation[]): Diagnostic => {
  return Diagnostic.create(range, message, severity, code, languageServer, relatedInformation);
};
