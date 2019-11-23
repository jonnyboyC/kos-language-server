import { DiagnosticSeverity } from 'vscode-languageserver';
import { DIAGNOSTICS } from '../../utilities/diagnosticsUtils';

/**
 * A class for holding information about a lint rule in kos-language-server
 */
export class LintRule {
  /**
   * The name of the rule
   */
  public readonly rule: string;

  /**
   * What level should this rule by reported as
   */
  public readonly level: SettableSeverity;

  /**
   * What diagnostics fall under this linter rule
   */
  public readonly diagnostics: ValueOf<typeof DIAGNOSTICS>[];

  /**
   * Are any rules owned by this rule
   */
  public readonly owned: LintRule[];

  /**
   * Construct a new lint rule
   * @param rule what is the name of the rule
   * @param level what level should this rule be applied
   * @param diagnostics what diagnostics fall under
   * @param owned what rules are owned by this this rule
   */
  constructor(
    rule: string,
    level: SettableSeverity,
    diagnostics: ValueOf<typeof DIAGNOSTICS>[],
    owned: LintRule[],
  ) {
    this.rule = rule;
    this.level = level;
    this.diagnostics = diagnostics;
    this.owned = owned;
  }

  /**
   * Create a rule from another rule
   * @param lintRule rule to clone from
   */
  public static from({ rule, level, diagnostics, owned }: LintRule): LintRule {
    return new LintRule(rule, level, diagnostics, owned);
  }
}

/**
 * Convert an lint interface into a lint class
 * @param lintTemplate lint interface
 */
function toRule(lintTemplate: LintRule): { flat: LintRule[]; tree: LintRule } {
  const flattened: LintRule[] = [];
  const nested: LintRule[] = [];

  for (const child of lintTemplate.owned) {
    const { flat, tree } = toRule(child);

    flattened.push(...flat);
    nested.push(tree);
  }

  const lintRule = LintRule.from({
    ...lintTemplate,
    owned: nested,
  });

  flattened.push(lintRule);
  return { flat: flattened, tree: lintRule };
}

/**
 * Settable severity
 */
export type SettableSeverity = 'error' | 'warning' | 'info' | 'hint' | 'off';

/**
 * Map from settable severity to diagnostic severity
 */
export const severityMapper = new Map([
  ['error', DiagnosticSeverity.Error],
  ['warning', DiagnosticSeverity.Warning],
  ['info', DiagnosticSeverity.Information],
  ['hint', DiagnosticSeverity.Hint],
]);

/**
 * Lint rules in data form
 */
const lintTemplates: LintRule[] = [
  {
    rule: 'parsing',
    level: 'error',
    diagnostics: [DIAGNOSTICS.PARSER_ERROR],
    owned: [],
  },
  {
    rule: 'file-loading',
    level: 'error',
    diagnostics: [DIAGNOSTICS.LOAD_ERROR],
    owned: [],
  },
  {
    rule: 'unreachable-code',
    level: 'error',
    diagnostics: [DIAGNOSTICS.UNREACHABLE_CODE],
    owned: [],
  },
  {
    rule: 'invalid-control-flow',
    level: 'error',
    diagnostics: [
      DIAGNOSTICS.INVALID_BREAK_CONTEXT,
      DIAGNOSTICS.INVALID_LAZY_GLOBAL,
      DIAGNOSTICS.INVALID_RETURN_CONTEXT,
      DIAGNOSTICS.INVALID_PRESERVE_CONTEXT,
    ],
    owned: [
      {
        rule: 'invalid-break',
        level: 'error',
        diagnostics: [DIAGNOSTICS.INVALID_BREAK_CONTEXT],
        owned: [],
      },
      {
        rule: 'invalid-return',
        level: 'error',
        diagnostics: [DIAGNOSTICS.INVALID_RETURN_CONTEXT],
        owned: [],
      },
      {
        rule: 'invalid-preserve',
        level: 'error',
        diagnostics: [DIAGNOSTICS.INVALID_PRESERVE_CONTEXT],
        owned: [],
      },
      {
        rule: 'invalid-lazy-global',
        level: 'error',
        diagnostics: [DIAGNOSTICS.INVALID_LAZY_GLOBAL],
        owned: [],
      },
    ],
  },
  {
    rule: 'no-global-parameters',
    level: 'warning',
    diagnostics: [DIAGNOSTICS.GLOBAL_PARAMETER],
    owned: [],
  },
  {
    rule: 'cannot-set',
    level: 'warning',
    diagnostics: [DIAGNOSTICS.CANNOT_SET],
    owned: [],
  },
  {
    rule: 'invalid-set',
    level: 'warning',
    diagnostics: [DIAGNOSTICS.INVALID_SET],
    owned: [],
  },
  {
    rule: 'deprecated',
    level: 'warning',
    diagnostics: [
      DIAGNOSTICS.DELETE_DEPRECATED,
      DIAGNOSTICS.COPY_DEPRECATED,
      DIAGNOSTICS.RENAME_DEPRECATED,
    ],
    owned: [
      {
        rule: 'deprecated-delete',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.DELETE_DEPRECATED],
        owned: [],
      },
      {
        rule: 'deprecated-copy',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.COPY_DEPRECATED],
        owned: [],
      },
      {
        rule: 'deprecated-rename',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.RENAME_DEPRECATED],
        owned: [],
      },
    ],
  },
  {
    rule: 'no-global-parameters',
    level: 'error',
    diagnostics: [DIAGNOSTICS.GLOBAL_PARAMETER],
    owned: [],
  },
  {
    rule: 'symbols-strict',
    level: 'error',
    diagnostics: [
      DIAGNOSTICS.SYMBOL_MAY_NOT_EXIST,
      DIAGNOSTICS.SYMBOL_MAY_NOT_RUNTIME_EXIST,
      DIAGNOSTICS.SYMBOL_WRONG_KIND,
      DIAGNOSTICS.SYMBOL_UNUSED_LOCALLY,
      DIAGNOSTICS.SYMBOL_UNUSED,
      DIAGNOSTICS.SYMBOL_SHADOWS,
      DIAGNOSTICS.SYMBOL_CONFLICT,
    ],
    owned: [
      {
        rule: 'symbol-may-not-exist',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.SYMBOL_MAY_NOT_EXIST],
        owned: [],
      },
      {
        rule: 'symbol-may-not-exist-closure',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.SYMBOL_MAY_NOT_RUNTIME_EXIST],
        owned: [],
      },
      {
        rule: 'symbol-wrong-kind',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.SYMBOL_WRONG_KIND],
        owned: [],
      },
      {
        rule: 'symbol-unused',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.SYMBOL_UNUSED],
        owned: [],
      },
      {
        rule: 'symbol-unused-global',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.SYMBOL_UNUSED_LOCALLY],
        owned: [],
      },
      {
        rule: 'symbol-shadowing',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.SYMBOL_SHADOWS],
        owned: [],
      },
      {
        rule: 'symbol-conflict',
        level: 'warning',
        diagnostics: [DIAGNOSTICS.SYMBOL_CONFLICT],
        owned: [],
      },
    ],
  },
  {
    rule: 'type-checking',
    level: 'hint',
    diagnostics: [
      DIAGNOSTICS.TYPE_WRONG,
      DIAGNOSTICS.TYPE_NO_CALL,
      DIAGNOSTICS.TYPE_WRONG_ARITY,
      DIAGNOSTICS.TYPE_LIST_INVALID,
      DIAGNOSTICS.TYPE_NO_INDEXER,
      DIAGNOSTICS.TYPE_NOT_FUNCTION,
      DIAGNOSTICS.TYPE_MISSING_SUFFIX,
      DIAGNOSTICS.TYPE_MISSING_OPERATOR,
    ],
    owned: [
      {
        rule: 'type-wrong',
        level: 'hint',
        diagnostics: [DIAGNOSTICS.TYPE_WRONG],
        owned: [],
      },
      {
        rule: 'type-no-call',
        level: 'hint',
        diagnostics: [DIAGNOSTICS.TYPE_NO_CALL],
        owned: [],
      },
      {
        rule: 'type-wrong-arity',
        level: 'hint',
        diagnostics: [DIAGNOSTICS.TYPE_WRONG_ARITY],
        owned: [],
      },
      {
        rule: 'type-list-invalid',
        level: 'hint',
        diagnostics: [DIAGNOSTICS.TYPE_LIST_INVALID],
        owned: [],
      },
      {
        rule: 'type-no-indexer',
        level: 'hint',
        diagnostics: [DIAGNOSTICS.TYPE_NO_INDEXER],
        owned: [],
      },
      {
        rule: 'type-not-function',
        level: 'hint',
        diagnostics: [DIAGNOSTICS.TYPE_NOT_FUNCTION],
        owned: [],
      },
      {
        rule: 'type-missing-suffix',
        level: 'hint',
        diagnostics: [DIAGNOSTICS.TYPE_MISSING_SUFFIX],
        owned: [],
      },
      {
        rule: 'type-missing-operator',
        level: 'hint',
        diagnostics: [DIAGNOSTICS.TYPE_MISSING_OPERATOR],
        owned: [],
      },
    ],
  },
];

const nested: LintRule[] = [];
const flattened: Map<string, LintRule> = new Map();

// convert the interfaces into a nested and flattened form
for (const lintTemplate of lintTemplates) {
  const { tree, flat } = toRule(lintTemplate);
  nested.push(tree);

  for (const rule of flat) {
    flattened.set(rule.rule, rule);
  }
}

export const lintCategories = nested;
export const lintRules = flattened;
