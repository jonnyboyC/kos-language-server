import { LintRule, lintRules } from './lintRules';
import { empty } from '../../utilities/typeGuards';
import { URI } from 'vscode-uri';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

/**
 * Class representing a ksconfig.json file. This is used to specify
 * configurations for this workspace
 */
export class WorkspaceConfiguration {
  /**
   * The location of the workspace config
   */
  public configDirectoryUri?: URI;

  /**
   * The location of the root volume (volume 0)
   */
  public readonly rootVolumePath?: string;

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
   * @param rootVolumePath root volume
   * @param bodies custom bodies
   * @param lintRules lint rules in place
   */
  constructor(
    configDirectoryUri?: URI,
    rootVolumePath?: string,
    bodies?: string[],
    lintRules?: Map<string, LintRule>,
  ) {
    this.configDirectoryUri = configDirectoryUri;
    this.rootVolumePath = rootVolumePath;
    this.bodies = bodies;
    this.lintRules = lintRules;
  }

  /**
   * What is the location of the root volume
   */
  public rootVolumeUri(): Maybe<URI> {
    if (empty(this.configDirectoryUri)) {
      return undefined;
    }

    const configDirectory = dirname(this.configDirectoryUri.fsPath);
    const rootVolume = join(configDirectory, this.rootVolumePath ?? '.');

    return existsSync(rootVolume)
      ? URI.file(rootVolume)
      : URI.file(configDirectory);
  }

  /**
   * Merge this configuration with another
   * @param config config to merge into this one
   */
  public merge(config: WorkspaceConfiguration): WorkspaceConfiguration {
    const configUri = config.configDirectoryUri || this.configDirectoryUri;
    const rootVolume = config.rootVolumePath || this.rootVolumePath;
    const bodies = config.bodies || this.bodies;
    const lintRules =
      !empty(config.lintRules) && !empty(this.lintRules)
        ? new Map([...this.lintRules, ...config.lintRules])
        : config.lintRules || this.lintRules;

    return new WorkspaceConfiguration(configUri, rootVolume, bodies, lintRules);
  }

  /**
   * Is this workspace configuration equal to another
   * @param other other workspace configuration to compare to
   */
  public equal(other: WorkspaceConfiguration): boolean {
    return JSON.stringify(this) === JSON.stringify(other);
  }
}

/**
 * The default configuration workspace configuration
 */
export const defaultWorkspaceConfiguration = new WorkspaceConfiguration(
  undefined,
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
