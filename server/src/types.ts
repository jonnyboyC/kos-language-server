import { SymbolTable } from './analysis/symbolTable';
import { IScript } from './parser/types';
import { Diagnostic, Range } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export interface IDocumentInfo {
  script: IScript;
  symbolsTable: SymbolTable;
  diagnostics: IDiagnosticUri[];
}

export interface ILoadData {
  caller: Range;
  uri: URI;
}

export type ValidateResult = IDiagnosticUri[] | SymbolTable;

export interface IDiagnosticUri extends Diagnostic {
  uri: string;
}
