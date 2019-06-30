import { SymbolTable } from './analysis/symbolTable';
import { IScript } from './parser/types';
import {
  Diagnostic,
  Range,
  MessageReader,
  MessageWriter,
  CompletionItem,
} from 'vscode-languageserver';
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

export interface ClientConfiguration {
  completionCase: 'lowercase' | 'uppercase' | 'camelcase' | 'pascalcase';
  kerbalSpaceProgramPath?: string;
  telnetHost: string;
  telnetPort: number;
  lspPort: number;
  trace: {
    server: {
      verbosity: 'off' | 'message' | 'verbose';
      format: 'text' | 'json';
      level: 'verbose' | 'info' | 'log' | 'warn' | 'error' | 'none';
    };
  };
}

export interface IClientCapabilities {
  hasConfiguration: boolean;
  hasWorkspaceFolder: boolean;
}

export interface KLSConfiguration {
  reader: MessageReader;
  writer: MessageWriter;
  workspaceFolder: string;
  workspaceUri: string;
  keywords: CompletionItem[];
  clientConfig: ClientConfiguration;
  clientCapability: IClientCapabilities;
}
