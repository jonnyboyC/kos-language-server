import { LintRule } from './lineRules';

/**
 * Class representing a ksconfig.json file. This is used to specify
 * configurations for this workspace
 */
export class Configuration {
  /**
   * The location of the root volume (volume 0)
   */
  public readonly rootVolume: string;

  /**
   * These are the lint rules enabled and at what level
   */
  public readonly lintRules: LintRule;

  /**
   * Construct a new configuration
   * @param rootVolume root volume
   * @param lintRules lint rules in place
   */
  constructor(rootVolume: string, lintRules: LintRule) {
    this.rootVolume = rootVolume;
    this.lintRules = lintRules;
  }
}
