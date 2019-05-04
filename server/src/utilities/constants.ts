import { CompletionItemKind, CompletionItem } from 'vscode-languageserver';

export const builtIn = 'builtIn';
export const iterator = 'iterator';

export const serverName = 'kos-vscode';
export const languageServer = 'kos-language-server';

export const keywords = new Set([
  'add',
  'and',
  'all',
  'at',
  'break',
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
    switch (caseKind) {
      case CaseKind.lowercase:
        casedKeywords.push(segments.join('').toLowerCase());
        break;
      case CaseKind.uppercase:
        casedKeywords.push(segments.join('').toUpperCase());
        break;
      case CaseKind.pascalcase:
        casedKeywords.push(segments.map(s => s[0].toUpperCase() + s.slice(1)).join(''));
        break;
      case CaseKind.camelcase:
        if (segments.length === 1) {
          casedKeywords.push(segments[0]);
        } else {
          const [first, ...rest] = segments;
          const casedRest = rest.map(s => s[0].toUpperCase() + s.slice(1));

          casedKeywords.push([first, ...casedRest].join(''));
        }
        break;
    }
  }

  return casedKeywords.map(keyword => ({
    kind: CompletionItemKind.Keyword,
    label: keyword,
    data: undefined,
  }));
};