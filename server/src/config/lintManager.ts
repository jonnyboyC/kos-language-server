import { LintRule, severityMapper } from './models/lintRules';
import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { empty } from '../utilities/typeGuards';

/**
 * A class to manager how and when rules should be applied to diagnostics
 */
export class LintManager {
  /**
   * What severity should a diagnostic be reported as
   */
  public readonly codeSeverities: Map<string, DiagnosticSeverity>;

  /**
   * What codes are associated with the config
   */
  public readonly configCodes: Set<string>;

  /**
   * Construct a new LintManager
   * @param severities
   */
  constructor(
    severities: Map<string, DiagnosticSeverity>,
    configRules: Set<string>,
  ) {
    this.codeSeverities = severities;
    this.configCodes = configRules;
  }

  /**
   * Apply the current lint settings to the provided diagnostics
   * @param diagnostics diagnostics to update
   */
  public apply<T extends Diagnostic>(diagnostics: T[]): T[] {
    const result: T[] = [];

    for (const diagnostic of diagnostics) {
      const severity = this.codeSeverities.get(diagnostic.code as string);

      if (!empty(severity)) {
        diagnostic.severity = severity;
        result.push(diagnostic);
      } else if (this.configCodes.has(diagnostic.code as string)) {
        result.push(diagnostic);
      }
    }

    return result;
  }

  /**
   * Create a lint manager from a set of lint rules
   * @param rules line rules to create diagnostic manager from
   */
  static fromRules(rules: LintRule[], configCodes: Set<string>) {
    // sort entries by the number owned to get in essentially breath first search
    const sorted = rules.sort(
      (entry1, entry2) => entry1.diagnostics.length - entry2.diagnostics.length,
    );

    const adjustedLintRules = new Map<LintRule, DiagnosticSeverity>();
    const removed = new Set<LintRule>();

    const update = (
      lintRule: LintRule,
      ruleSeverity: Maybe<DiagnosticSeverity>,
    ) => {
      if (empty(ruleSeverity)) {
        removed.add(lintRule);
        adjustedLintRules.delete(lintRule);
      } else {
        adjustedLintRules.set(lintRule, ruleSeverity);
        removed.delete(lintRule);
      }
    };

    const updateOwned = (
      rule: LintRule,
      severity: Maybe<DiagnosticSeverity>,
    ) => {
      // add diagnostics to appropriate bin
      for (const owned of rule.owned) {
        update(owned, severity);
        updateOwned(owned, severity);
      }
    };

    // place rules in each bin
    for (const rule of sorted) {
      const severity = severityMapper.get(rule.level);

      // set diagnostics to appropriate level
      update(rule, severity);
      updateOwned(rule, severity);
    }

    const codeSeverities = new Map<string, DiagnosticSeverity>();
    for (const [rule, severity] of adjustedLintRules) {
      for (const diagnostics of rule.diagnostics) {
        codeSeverities.set(diagnostics, severity);
      }
    }

    // create lint manager
    return new LintManager(codeSeverities, configCodes);
  }
}
