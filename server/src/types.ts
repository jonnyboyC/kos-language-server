import { SymbolTable } from './analysis/symbolTable';
import { IScript } from './parser/types';
import { Diagnostic, Range } from 'vscode-languageserver';

export interface IDocumentInfo {
  script: IScript;
  symbolsTable: SymbolTable;
  diagnostics: IDiagnosticUri[];
}

export interface ILoadData {
  caller: Range;
  uri: string;
  path: string;
}

export type ValidateResult = IDiagnosticUri[] | SymbolTable;

export interface IDiagnosticUri extends Diagnostic {
  uri: string;
}
