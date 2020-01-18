import { ConfigurationService } from '../../src/services/configurationService';
import {
  defaultServerConfiguration,
  defaultClientConfiguration,
} from '../../src/config/models/serverConfiguration';
import { defaultWorkspaceConfiguration } from '../../src/config/models/workspaceConfiguration';
import {
  createMockDocumentService,
  createMockConnection,
} from '../utilities/mockServices';
import { serverName } from '../../src/utilities/constants';
import {
  TextDocument,
  IConnection,
  DidChangeConfigurationNotification,
  DidChangeConfigurationParams,
} from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { parseWorkspaceConfiguration } from '../../src/config/workspaceConfigParser';
import { ClientConfiguration } from '../../src/types';

let client: IConnection;
let server: IConnection;
let mockDocumentService: ReturnType<typeof createMockDocumentService>;
let configurationService: ConfigurationService;
const capableServerConfiguration = defaultServerConfiguration.merge({
  clientCapability: {
    hasConfiguration: true,
    hasWorkspaceFolder: true,
  },
});

function mockChangeConfigNotification(
  clientConfig: ClientConfiguration,
): DidChangeConfigurationParams {
  return {
    settings: {
      [serverName]: clientConfig,
    },
  };
}

beforeEach(() => {
  const connections = createMockConnection();
  client = connections.client;
  server = connections.server;
  mockDocumentService = createMockDocumentService(new Map());

  configurationService = new ConfigurationService(
    capableServerConfiguration,
    defaultWorkspaceConfiguration,
    server,
    mockDocumentService,
  );
});

describe('configurationService', () => {
  describe('when constructing an instance', () => {
    test('it has the right properties', () => {
      expect(configurationService.serverConfiguration).toBe(
        capableServerConfiguration,
      );
      expect(configurationService.workspaceConfiguration).toBe(
        defaultWorkspaceConfiguration,
      );
    });
  });

  describe('when updating the server configuration', () => {
    test('merges the configurations', () => {
      const workspaceFolder = 'other';

      configurationService.updateServerConfiguration({ workspaceFolder });
      expect(configurationService.serverConfiguration).toStrictEqual(
        capableServerConfiguration.merge({ workspaceFolder }),
      );
    });
  });

  describe('when the server configuration is updated', () => {
    test('change event is fired with appropriate config', () => {
      const clientConfig = { ...defaultClientConfiguration, lspPort: 1000 };

      const expectedServerConfiguration = capableServerConfiguration.merge({
        clientConfig,
      });

      configurationService.on(
        'change',
        ({ workspaceConfiguration, serverConfiguration }) => {
          expect(workspaceConfiguration).toEqual(defaultWorkspaceConfiguration);
          expect(serverConfiguration).toEqual(expectedServerConfiguration);
        },
      );

      client.sendNotification(
        DidChangeConfigurationNotification.type,
        mockChangeConfigNotification(clientConfig),
      );
    });
  });

  describe('when the workspace configuration is updated', () => {
    test('change event is fired with appropriate config', () => {
      const configDoc = TextDocument.create(
        URI.file('example').toString(),
        'json',
        1,
        '{"archive": "other"}',
      );

      const userConfig = parseWorkspaceConfiguration(configDoc);
      expect(userConfig.diagnostics).toHaveLength(0);

      const expectedWorkspaceConfiguration = defaultWorkspaceConfiguration.merge(
        userConfig.config,
      );

      configurationService.on(
        'change',
        ({ workspaceConfiguration, serverConfiguration }) => {
          expect(workspaceConfiguration).toEqual(
            expectedWorkspaceConfiguration,
          );
          expect(serverConfiguration).toEqual(capableServerConfiguration);
        },
      );

      configurationService.on('error', diagnostics => {
        expect(diagnostics).toHaveLength(0);
      });

      mockDocumentService.emit('configChange', configDoc);
    });
  });
});
