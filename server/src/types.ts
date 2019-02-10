import { ScopeManager } from './analysis/scopeManager';
import { RunInstType, IScript } from './parser/types';
import { Diagnostic } from 'vscode-languageserver';

export interface IDocumentInfo {
  script: IScript;
  scopeManager: ScopeManager;
}

export interface ILoadData {
  uri: string;
  path: string;
  inst: RunInstType;
}

export type ValidateResult = IDiagnosticUri[] | ScopeManager;

export interface IDiagnosticUri extends Diagnostic {
  uri: string;
}
