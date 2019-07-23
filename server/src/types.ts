import { SymbolTable } from './analysis/symbolTable';
import { IScript } from './parser/types';
import {
  Diagnostic,
  MessageReader,
  MessageWriter,
  CompletionItem,
  TextDocument,
} from 'vscode-languageserver';
import { Token } from './entities/token';

export interface IDocumentInfo {
  script: IScript;
  regions: Token[];
  symbolTable: SymbolTable;
  diagnostics: DiagnosticUri[];
}

export interface LoadedDocuments {
  documents: TextDocument[];
  diagnostics: Diagnostic[];
}

export interface DiagnosticUri extends Diagnostic {
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
