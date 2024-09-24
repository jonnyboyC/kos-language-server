import { EventEmitter } from 'events';
import { WorkspaceConfiguration } from '../config/models/workspaceConfiguration';
import {
  Connection,
  DidChangeConfigurationParams,
} from 'vscode-languageserver';
import { DocumentService } from './documentService';
import { serverName } from '../utilities/constants';
import { ServerConfiguration } from '../config/models/serverConfiguration';
import { parseWorkspaceConfiguration } from '../config/workspaceConfigParser';
import { DiagnosticUri } from '../types';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface ChangeConfiguration {
  serverConfiguration: ServerConfiguration;
  workspaceConfiguration: WorkspaceConfiguration;
}

type ChangeHandler = (configurations: ChangeConfiguration) => void;
type ErrorHandler = (errors: DiagnosticUri[], uri: string) => void;

export declare interface ConfigurationService {
  on(event: 'change', listener: ChangeHandler): this;
  emit(event: 'change', ...args: Parameters<ChangeHandler>): boolean;
  on(event: 'error', listener: ErrorHandler): this;
  emit(event: 'error', ...args: Parameters<ErrorHandler>): boolean;
}

type ConfigurationConnection = Pick<Connection, 'onDidChangeConfiguration'>;

/**
 * A service responsible for collection and organizing user
 * configurations
 */
export class ConfigurationService extends EventEmitter {
  /**
   * What is the current workspace's configuration
   */
  public workspaceConfiguration: WorkspaceConfiguration;

  /**
   * What is the server configuration
   */
  public serverConfiguration: ServerConfiguration;

  /**
   * What is the default workspace configuration
   */
  private defaultWorkspaceConfiguration: WorkspaceConfiguration;

  /**
   * Create a new configuration service
   * @param defaultServerConfiguration the default server configuration
   * @param defaultWorkSpaceConfiguration the default workspace configuration
   * @param conn connection to the client to listen to events
   * @param documentService a document server to listen to config change events
   */
  constructor(
    defaultServerConfiguration: ServerConfiguration,
    defaultWorkSpaceConfiguration: WorkspaceConfiguration,
    conn: ConfigurationConnection,
    documentService: DocumentService,
  ) {
    super();
    this.serverConfiguration = defaultServerConfiguration;
    this.workspaceConfiguration = defaultWorkSpaceConfiguration;
    this.defaultWorkspaceConfiguration = defaultWorkSpaceConfiguration;

    this.listen(conn, documentService);
  }

  /**
   * Update the server configuration with a diff
   * @param config config to use to update configuration with
   */
  public updateServerConfiguration(config: Partial<ServerConfiguration>) {
    this.serverConfiguration = this.serverConfiguration.merge(config);
  }

  /**
   * Add event listens for server and workspace config changes
   * @param conn client connection to listen for config changes
   * @param documentService document server to listen to workspace config changes
   */
  private listen(
    conn: ConfigurationConnection,
    documentService: DocumentService,
  ) {
    conn.onDidChangeConfiguration(this.onChangeServerConfig.bind(this));
    documentService.on('configChange', this.onChangeWorkspaceConfig.bind(this));
  }

  /**
   * Server configuration change handler. Updates the configuration when appropriate
   * @param change changes that occurred to the server configuration
   */
  private onChangeServerConfig(change: DidChangeConfigurationParams): void {
    const { clientCapability } = this.serverConfiguration;

    // check if the client supports configurations
    if (clientCapability.hasConfiguration) {
      const serverConfiguration = this.serverConfiguration.merge({
        clientConfig: change.settings[serverName],
      });

      // if the configuration has changed emit change event
      if (!this.serverConfiguration.equal(serverConfiguration)) {
        this.serverConfiguration = serverConfiguration;

        this.emit('change', {
          serverConfiguration,
          workspaceConfiguration: this.workspaceConfiguration,
        });
      }
    }
  }

  /**
   * Workspace configuration change handler. Update the configuration when appropriate
   * @param document workspace config document
   */
  private onChangeWorkspaceConfig(document: TextDocument): void {
    const parsedConfiguration = parseWorkspaceConfiguration(document);
    const workspaceConfiguration = this.defaultWorkspaceConfiguration.merge(
      parsedConfiguration.config,
    );

    this.emit('error', parsedConfiguration.diagnostics, document.uri);

    // if the configuration has changed emit change event
    if (!this.workspaceConfiguration.equal(workspaceConfiguration)) {
      this.workspaceConfiguration = workspaceConfiguration;

      this.emit('change', {
        serverConfiguration: this.serverConfiguration,
        workspaceConfiguration,
      });
    }
  }
}
