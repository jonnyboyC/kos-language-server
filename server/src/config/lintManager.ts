import { LintRule, severityMapper } from './lintRules';
import { DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import { empty } from '../utilities/typeGuards';

/**
 * A class to manager how and when rules should be applied to diagnostics
 */
export class LintManager {
  /**
   * What severity should a diagnostic be reported as
   */
  public readonly severities: Map<string, DiagnosticSeverity>;

  /**
   * Construct a new LintManager
   * @param severities
   */
  constructor(severities: Map<string, DiagnosticSeverity>) {
    this.severities = severities;
  }

  /**
   * Apply the current lint settings to the provided diagnostics
   * @param diagnostics diagnostics to update
   */
  public apply<T extends Diagnostic>(diagnostics: T[]): T[] {
    const result: T[] = [];

    for (const diagnostic of diagnostics) {
      const severity = this.severities.get(diagnostic.code as string);

      if (!empty(severity)) {
        diagnostic.severity = severity;
        result.push(diagnostic);
      }
    }

    return result;
  }

  /**
   * Create a lint manager from a set of lint rules
   * @param rules line rules to create diagnostic manager from
   */
  static fromRules(rules: LintRule[]) {
    // sort entries by the number owned to get in essentially breath first search
    const sorted = rules.sort(
      (entry1, entry2) => entry1.owned.length - entry2.owned.length,
    );

    const severities = new Map<string, DiagnosticSeverity>();
    const removed = new Set<string>();

    // place rules in each bin
    for (const rule of sorted) {
      let set = false;

      // determine if any diagnostics in this rule have
      // already been accounted for
      for (const diagnostic of rule.diagnostics) {
        if (severities.has(diagnostic)) {
          set = true;
          break;
        }

        if (removed.has(diagnostic)) {
          set = true;
          break;
        }
      }

      if (set) {
        continue;
      }

      const severity = severityMapper.get(rule.level);

      // add diagnostics to appropriate bin
      for (const diagnostic of rule.diagnostics) {
        if (empty(severity)) {
          removed.add(diagnostic);
        } else {
          severities.set(diagnostic, severity);
        }
      }
    }

    // create lint manager
    return new LintManager(severities);
  }
}
