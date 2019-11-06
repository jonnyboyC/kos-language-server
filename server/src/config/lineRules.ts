import { DiagnosticSeverity } from 'vscode-languageserver';
import { DIAGNOSTICS } from '../utilities/diagnosticsUtils';

export class LintRule {
  /**
   * The name of the rule
   */
  public readonly rule: string;

  /**
   * What level should this rule by reported as
   */
  public readonly level: DiagnosticSeverity;

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
    level: DiagnosticSeverity,
    diagnostics: ValueOf<typeof DIAGNOSTICS>[],
    owned: LintRule[],
  ) {
    this.rule = rule;
    this.level = level;
    this.diagnostics = diagnostics;
    this.owned = owned;
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

  const lintRule = new LintRule(
    lintTemplate.rule,
    lintTemplate.level,
    lintTemplate.diagnostics,
    nested,
  );

  flattened.push(lintRule);
  return { flat: flattened, tree: lintRule };
}

/**
 * Lint rules in data form
 */
const lintTemplates: LintRule[] = [
  {
    rule: 'parsing',
    level: DiagnosticSeverity.Error,
    diagnostics: [DIAGNOSTICS.PARSER_ERROR],
    owned: [],
  },
  {
    rule: 'file-loading',
    level: DiagnosticSeverity.Error,
    diagnostics: [DIAGNOSTICS.LOAD_ERROR],
    owned: [],
  },
  {
    rule: 'unreachable-code',
    level: DiagnosticSeverity.Error,
    diagnostics: [DIAGNOSTICS.UNREACHABLE_CODE],
    owned: [],
  },
  {
    rule: 'invalid-control-flow',
    level: DiagnosticSeverity.Error,
    diagnostics: [
      DIAGNOSTICS.INVALID_BREAK_CONTEXT,
      DIAGNOSTICS.INVALID_LAZY_GLOBAL,
      DIAGNOSTICS.INVALID_RETURN_CONTEXT,
      DIAGNOSTICS.INVALID_PRESERVE_CONTEXT,
    ],
    owned: [
      {
        rule: 'invalid-break',
        level: DiagnosticSeverity.Error,
        diagnostics: [DIAGNOSTICS.INVALID_BREAK_CONTEXT],
        owned: [],
      },
      {
        rule: 'invalid-return',
        level: DiagnosticSeverity.Error,
        diagnostics: [DIAGNOSTICS.INVALID_RETURN_CONTEXT],
        owned: [],
      },
      {
        rule: 'invalid-preserve',
        level: DiagnosticSeverity.Error,
        diagnostics: [DIAGNOSTICS.INVALID_PRESERVE_CONTEXT],
        owned: [],
      },
      {
        rule: 'invalid-lazy-global',
        level: DiagnosticSeverity.Error,
        diagnostics: [DIAGNOSTICS.INVALID_LAZY_GLOBAL],
        owned: [],
      },
    ],
  },
  {
    rule: 'no-global-parameters',
    level: DiagnosticSeverity.Warning,
    diagnostics: [DIAGNOSTICS.GLOBAL_PARAMETER],
    owned: [],
  },
  {
    rule: 'cannot-set',
    level: DiagnosticSeverity.Warning,
    diagnostics: [DIAGNOSTICS.CANNOT_SET],
    owned: [],
  },
  {
    rule: 'invalid-set',
    level: DiagnosticSeverity.Warning,
    diagnostics: [DIAGNOSTICS.INVALID_SET],
    owned: [],
  },
  {
    rule: 'deprecated',
    level: DiagnosticSeverity.Warning,
    diagnostics: [
      DIAGNOSTICS.DELETE_DEPRECATED,
      DIAGNOSTICS.COPY_DEPRECATED,
      DIAGNOSTICS.RENAME_DEPRECATED,
    ],
    owned: [
      {
        rule: 'deprecated-delete',
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.DELETE_DEPRECATED],
        owned: [],
      },
      {
        rule: 'deprecated-copy',
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.COPY_DEPRECATED],
        owned: [],
      },
      {
        rule: 'deprecated-rename',
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.RENAME_DEPRECATED],
        owned: [],
      },
    ],
  },
  {
    rule: 'no-global-parameters',
    level: DiagnosticSeverity.Error,
    diagnostics: [DIAGNOSTICS.GLOBAL_PARAMETER],
    owned: [],
  },
  {
    rule: 'symbols-strict',
    level: DiagnosticSeverity.Error,
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
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.SYMBOL_MAY_NOT_EXIST],
        owned: [],
      },
      {
        rule: 'symbol-may-not-exist-closure',
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.SYMBOL_MAY_NOT_RUNTIME_EXIST],
        owned: [],
      },
      {
        rule: 'symbol-wrong-kind',
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.SYMBOL_WRONG_KIND],
        owned: [],
      },
      {
        rule: 'symbol-unused',
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.SYMBOL_UNUSED],
        owned: [],
      },
      {
        rule: 'symbol-unused-global',
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.SYMBOL_UNUSED_LOCALLY],
        owned: [],
      },
      {
        rule: 'symbol-shadowing',
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.SYMBOL_SHADOWS],
        owned: [],
      },
      {
        rule: 'symbol-conflict',
        level: DiagnosticSeverity.Warning,
        diagnostics: [DIAGNOSTICS.SYMBOL_CONFLICT],
        owned: [],
      },
    ],
  },
  {
    rule: 'type-checking',
    level: DiagnosticSeverity.Hint,
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
        level: DiagnosticSeverity.Hint,
        diagnostics: [DIAGNOSTICS.TYPE_WRONG],
        owned: [],
      },
      {
        rule: 'type-no-call',
        level: DiagnosticSeverity.Hint,
        diagnostics: [DIAGNOSTICS.TYPE_NO_CALL],
        owned: [],
      },
      {
        rule: 'type-wrong-arity',
        level: DiagnosticSeverity.Hint,
        diagnostics: [DIAGNOSTICS.TYPE_WRONG_ARITY],
        owned: [],
      },
      {
        rule: 'type-list-invalid',
        level: DiagnosticSeverity.Hint,
        diagnostics: [DIAGNOSTICS.TYPE_LIST_INVALID],
        owned: [],
      },
      {
        rule: 'type-no-indexer',
        level: DiagnosticSeverity.Hint,
        diagnostics: [DIAGNOSTICS.TYPE_NO_INDEXER],
        owned: [],
      },
      {
        rule: 'type-not-function',
        level: DiagnosticSeverity.Hint,
        diagnostics: [DIAGNOSTICS.TYPE_NOT_FUNCTION],
        owned: [],
      },
      {
        rule: 'type-missing-suffix',
        level: DiagnosticSeverity.Hint,
        diagnostics: [DIAGNOSTICS.TYPE_MISSING_SUFFIX],
        owned: [],
      },
      {
        rule: 'type-missing-operator',
        level: DiagnosticSeverity.Hint,
        diagnostics: [DIAGNOSTICS.TYPE_MISSING_OPERATOR],
        owned: [],
      },
    ],
  },
];

const nested: LintRule[] = [];
const flattened: LintRule[] = [];

// convert the interfaces into a nested and flattened form
for (const lintTemplate of lintTemplates) {
  const { tree, flat } = toRule(lintTemplate);
  nested.push(tree);
  flattened.push(...flat);
}

export const lintCategories = nested;
export const lintRules = flattened;
