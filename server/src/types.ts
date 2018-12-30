import { SyntaxTree } from './entities/syntaxTree';
import { ScopeManager } from './analysis/scopeManager';
import { RunInstType } from './parser/types';
import { Diagnostic } from 'vscode-languageserver';

export interface IDocumentInfo {
  syntaxTree: SyntaxTree;
  scopeManager: ScopeManager;
}

export interface ILoadData {
  uri: string;
  path: string;
  inst: RunInstType;
}

export interface DiagnosticUri extends Diagnostic {
  uri: string;
}