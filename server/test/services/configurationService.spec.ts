import { ConfigurationService } from '../../src/services/configurationService';
import { defaultServerConfiguration } from '../../src/config/models/serverConfiguration';
import { defaultWorkspaceConfiguration } from '../../src/config/models/workspaceConfiguration';
import {
  createMockConfigConnection,
  createMockDocumentService,
} from '../utilities/mockServices';

describe('configurationService', () => {
  describe('when constructing an instance', () => {
    test('it has the right properties', () => {
      const mockConnection = createMockConfigConnection();
      const mockDocumentService = createMockDocumentService(new Map());

      const configurationService = new ConfigurationService(
        defaultServerConfiguration,
        defaultWorkspaceConfiguration,
        mockConnection,
        mockDocumentService,
      );

      expect(configurationService.serverConfiguration).toBe(
        defaultServerConfiguration,
      );
      expect(configurationService.workspaceConfiguration).toBe(
        defaultWorkspaceConfiguration,
      );
    });
  });
});
