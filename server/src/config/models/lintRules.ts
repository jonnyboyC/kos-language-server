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
    diagnostics: lintTemplate.diagnostics.concat(
      ...nested.map(n => n.diagnostics),
    ),
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
const lintTemplates: LintRule = {
  rule: 'all',
  level: 'warning',
  diagnostics: [],
  owned: [
    {
      rule: 'scanning',
      level: 'error',
      diagnostics: [DIAGNOSTICS.SCANNER_ERROR],
      owned: [],
    },
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
      rule: 'no-global-parameters',
      level: 'error',
      diagnostics: [DIAGNOSTICS.GLOBAL_PARAMETER],
      owned: [],
    },
    {
      rule: 'uninitialized-set',
      level: 'warning',
      diagnostics: [DIAGNOSTICS.UNINITIALIZED_SET],
      owned: [],
    },
    {
      rule: 'control-flow',
      level: 'error',
      diagnostics: [],
      owned: [
        {
          rule: 'control-flow-break',
          level: 'error',
          diagnostics: [DIAGNOSTICS.INVALID_BREAK_CONTEXT],
          owned: [],
        },
        {
          rule: 'control-flow-return',
          level: 'error',
          diagnostics: [DIAGNOSTICS.INVALID_RETURN_CONTEXT],
          owned: [],
        },
        {
          rule: 'control-flow-preserve',
          level: 'error',
          diagnostics: [DIAGNOSTICS.INVALID_PRESERVE_CONTEXT],
          owned: [],
        },
        {
          rule: 'control-flow-lazy-global',
          level: 'error',
          diagnostics: [DIAGNOSTICS.INVALID_LAZY_GLOBAL],
          owned: [],
        },
      ],
    },
    {
      rule: 'deprecated',
      level: 'warning',
      diagnostics: [],
      owned: [
        {
          rule: 'deprecated-delete',
          level: 'info',
          diagnostics: [DIAGNOSTICS.DELETE_DEPRECATED],
          owned: [],
        },
        {
          rule: 'deprecated-copy',
          level: 'info',
          diagnostics: [DIAGNOSTICS.COPY_DEPRECATED],
          owned: [],
        },
        {
          rule: 'deprecated-rename',
          level: 'info',
          diagnostics: [DIAGNOSTICS.RENAME_DEPRECATED],
          owned: [],
        },
      ],
    },
    {
      rule: 'symbols-strict',
      level: 'error',
      diagnostics: [],
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
          rule: 'symbol-unused-locally',
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
      diagnostics: [],
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
          level: 'warning',
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
        {
          rule: 'type-not-setter',
          level: 'warning',
          diagnostics: [DIAGNOSTICS.TYPE_NO_SETTER],
          owned: [],
        },
      ],
    },
  ],
};

interface LintStructure {
  nested: LintRule[];
  flattened: Map<string, LintRule>;
}

function structureRules(lintTemplate: LintRule): LintStructure {
  const nested: LintRule[] = [];
  const flattened: Map<string, LintRule> = new Map();

  // convert the interfaces into a nested and flattened form
  const { tree, flat } = toRule(lintTemplate);
  nested.push(tree);

  for (const rule of flat) {
    flattened.set(rule.rule, rule);
  }

  return { nested, flattened };
}

const lintResult = structureRules(lintTemplates);

export const lintCategories = lintResult.nested;
export const lintRules = lintResult.flattened;
