import { ScopeManager } from './analysis/scopeManager';
import { IScript } from './parser/types';
import { Diagnostic, Range } from 'vscode-languageserver';

export interface IDocumentInfo {
  script: IScript;
  scopeManager: ScopeManager;
}

export interface ILoadData {
  caller: Range;
  uri: string;
  path: string;
}

export type ValidateResult = IDiagnosticUri[] | ScopeManager;

export interface IDiagnosticUri extends Diagnostic {
  uri: string;
}
