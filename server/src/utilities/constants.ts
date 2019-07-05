import { CompletionItemKind, CompletionItem } from 'vscode-languageserver';
import { toCase } from './stringUtils';

export const builtIn = 'builtIn';
export const iterator = 'iterator';

export const serverName = 'kos-vscode';
export const languageServer = 'kos-language-server';

export const notFoundErrorCode = 'ENOTFOUND';

export const keywords = new Set([
  'add',
  'and',
  'all',
  'at',
  'break',
  'choose',
  'clearscreen',
  'compile',
  'copy',
  'do',
  'declare',
  'defined',
  'delete',
  'edit',
  'else',
  'false',
  'file',
  'for',
  'from',
  'function',
  'global',
  'if',
  'in',
  'is',
  'lazyglobal',
  'list',
  'local',
  'lock',
  'log',
  'not',
  'off',
  'on',
  'or',
  'once',
  'parameter',
  'preserve',
  'print',
  'reboot',
  'remove',
  'rename',
  'return',
  'run',
  'runpath',
  'runoncepath',
  'set',
  'shutdown',
  'stage',
  'step',
  'switch',
  'then',
  'to',
  'true',
  'toggle',
  'unlock',
  'unset',
  'until',
  'volume',
  'wait',
  'when',
]);

const keywordSegments: string[][] = [
  ['add'],
  ['and'],
  ['all'],
  ['at'],
  ['break'],
  ['choose'],
  ['clear', 'screen'],
  ['compile'],
  ['copy'],
  ['do'],
  ['declare'],
  ['defined'],
  ['delete'],
  ['edit'],
  ['else'],
  ['false'],
  ['file'],
  ['for'],
  ['from'],
  ['function'],
  ['global'],
  ['if'],
  ['in'],
  ['is'],
  ['lazy', 'global'],
  ['list'],
  ['local'],
  ['lock'],
  ['log'],
  ['not'],
  ['off'],
  ['on'],
  ['or'],
  ['once'],
  ['parameter'],
  ['preserve'],
  ['print'],
  ['reboot'],
  ['remove'],
  ['rename'],
  ['return'],
  ['run'],
  ['run', 'path'],
  ['run', 'once', 'path'],
  ['set'],
  ['shutdown'],
  ['stage'],
  ['step'],
  ['switch'],
  ['then'],
  ['to'],
  ['true'],
  ['toggle'],
  ['unlock'],
  ['unset'],
  ['until'],
  ['volume'],
  ['wait'],
  ['when'],
];

/**
 * Generate a cased set of keyword completion items
 * @param caseKind case of the keyword completions
 */
export const keywordCompletions = (caseKind: CaseKind): CompletionItem[] => {
  const casedKeywords: string[] = [];

  for (const segments of keywordSegments) {
    casedKeywords.push(toCase(caseKind, ...segments));
  }

  return casedKeywords.map(keyword => ({
    kind: CompletionItemKind.Keyword,
    label: keyword,
    data: undefined,
  }));
};