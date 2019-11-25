import { ConfigurationService } from '../../src/services/configurationService';
import {
  defaultServerConfiguration,
  defaultClientConfiguration,
} from '../../src/config/models/serverConfiguration';
import { defaultWorkspaceConfiguration } from '../../src/config/models/workspaceConfiguration';
import {
  createMockConfigConnection,
  createMockDocumentService,
} from '../utilities/mockServices';
import { serverName } from '../../src/utilities/constants';
import { TextDocument } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { parseWorkspaceConfiguration } from '../../src/config/workspaceConfigParser';

let mockConnection: ReturnType<typeof createMockConfigConnection>;
let mockDocumentService: ReturnType<typeof createMockDocumentService>;
let configurationService: ConfigurationService;
const capableServerConfiguration = defaultServerConfiguration.merge({
  clientCapability: {
    hasConfiguration: true,
    hasWorkspaceFolder: true,
  },
});

beforeEach(() => {
  mockConnection = createMockConfigConnection();
  mockDocumentService = createMockDocumentService(new Map());

  configurationService = new ConfigurationService(
    capableServerConfiguration,
    defaultWorkspaceConfiguration,
    mockConnection,
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

      mockConnection.callConfig({
        settings: {
          [serverName]: clientConfig,
        },
      });
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
