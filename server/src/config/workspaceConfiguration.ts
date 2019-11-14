import { LintRule, lintRules } from './lintRules';
import { empty } from '../utilities/typeGuards';
import { URI } from 'vscode-uri';

/**
 * Class representing a ksconfig.json file. This is used to specify
 * configurations for this workspace
 */
export class WorkspaceConfiguration {
  /**
   * The location of the workspace config
   */
  public configUri: URI;

  /**
   * The location of the root volume (volume 0)
   */
  public readonly rootVolume?: string;

  /**
   * The name of any custom bodies used i.e. modded
   */
  public readonly bodies?: string[];

  /**
   * These are the lint rules enabled and at what level
   */
  public readonly lintRules?: Map<string, LintRule>;

  /**
   * Construct a new configuration
   * @param rootVolume root volume
   * @param bodies custom bodies
   * @param lintRules lint rules in place
   */
  constructor(
    configUri: URI,
    rootVolume?: string,
    bodies?: string[],
    lintRules?: Map<string, LintRule>,
  ) {
    this.configUri = configUri;
    this.rootVolume = rootVolume;
    this.bodies = bodies;
    this.lintRules = lintRules;
  }

  /**
   * Merge this configuration with another
   * @param config config to merge into this one
   */
  public merge(config: WorkspaceConfiguration): WorkspaceConfiguration {
    const rootVolume = config.rootVolume || this.rootVolume;
    const bodies = config.bodies || this.bodies;
    const lintRules =
      !empty(config.lintRules) && !empty(this.lintRules)
        ? new Map([...this.lintRules, ...config.lintRules])
        : config.lintRules || this.lintRules;

    return new WorkspaceConfiguration(
      config.configUri,
      rootVolume,
      bodies,
      lintRules,
    );
  }
}

/**
 * The default configuration workspace configuration
 */
export const defaultWorkspaceConfiguration = new WorkspaceConfiguration(
  URI.file('/dummy'),
  '.',
  [
    'kerbol',
    'moho',
    'eve',
    'gilly',
    'kerbin',
    'mun',
    'minmus',
    'duna',
    'ike',
    'dres',
    'jool',
    'laythe',
    'vall',
    'tylo',
    'bop',
    'pol',
    'eeloo',
  ],
  new Map([...lintRules].filter(([_, rule]) => rule.owned.length === 0)),
);
