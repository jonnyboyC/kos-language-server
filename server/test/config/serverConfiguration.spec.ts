import { URI } from 'vscode-uri';
import {
  ServerConfiguration,
  defaultServerConfiguration,
} from '../../src/config/serverConfiguration';
import { ClientConfiguration, IClientCapabilities } from '../../src/types';

const clientConfig: ClientConfiguration = {
  completionCase: 'lowercase',
  telnetHost: '127.358.111',
  telnetPort: 8080,
  lspPort: 7234,
  trace: {
    server: {
      format: 'json',
      level: 'info',
      verbosity: 'verbose',
    },
  },
};

const clientCapability: IClientCapabilities = {
  hasConfiguration: false,
  hasWorkspaceFolder: false,
};

const workspaceFolder = 'example';
const workspaceUri = URI.file(workspaceFolder);

describe('ServerConfiguration', () => {
  describe('When constructing an instance', () => {
    test('It has the appropriate properties', () => {
      const configuration = new ServerConfiguration(
        clientConfig,
        clientCapability,
        workspaceFolder,
        workspaceUri,
      );

      expect(configuration.clientCapability).toBe(clientCapability);
      expect(configuration.clientConfig).toBe(clientConfig);
      expect(configuration.workspaceFolder).toBe(workspaceFolder);
      expect(configuration.workspaceUri).toBe(workspaceUri);
    });
  });

  describe('When merging configurations', () => {
    test('They merge correctly', () => {
      const newConfiguration1 = defaultServerConfiguration.merge({
        clientConfig,
      });

      expect(newConfiguration1.clientCapability).toBe(
        defaultServerConfiguration.clientCapability,
      );
      expect(newConfiguration1.clientConfig).toStrictEqual(
        Object.assign(
          {},
          defaultServerConfiguration.clientConfig,
          clientConfig,
        ),
      );
      expect(newConfiguration1.workspaceFolder).toBe(
        defaultServerConfiguration.workspaceFolder,
      );
      expect(newConfiguration1.workspaceUri).toBe(
        defaultServerConfiguration.workspaceUri,
      );

      const newConfiguration2 = defaultServerConfiguration.merge({
        clientCapability,
      });

      expect(newConfiguration2.clientCapability).toBe(clientCapability);
      expect(newConfiguration2.clientConfig).toStrictEqual(
        defaultServerConfiguration.clientConfig,
      );
      expect(newConfiguration2.workspaceFolder).toBe(
        defaultServerConfiguration.workspaceFolder,
      );
      expect(newConfiguration2.workspaceUri).toBe(
        defaultServerConfiguration.workspaceUri,
      );

      const newConfiguration3 = defaultServerConfiguration.merge({
        workspaceFolder,
      });

      expect(newConfiguration3.clientCapability).toBe(
        defaultServerConfiguration.clientCapability,
      );
      expect(newConfiguration3.clientConfig).toStrictEqual(
        defaultServerConfiguration.clientConfig,
      );
      expect(newConfiguration3.workspaceFolder).toBe(workspaceFolder);
      expect(newConfiguration3.workspaceUri).toBe(
        defaultServerConfiguration.workspaceUri,
      );

      const newConfiguration4 = defaultServerConfiguration.merge({
        workspaceUri,
      });

      expect(newConfiguration4.clientCapability).toBe(
        defaultServerConfiguration.clientCapability,
      );
      expect(newConfiguration4.clientConfig).toStrictEqual(
        defaultServerConfiguration.clientConfig,
      );
      expect(newConfiguration4.workspaceFolder).toBe(
        defaultServerConfiguration.workspaceFolder,
      );
      expect(newConfiguration4.workspaceUri).toBe(workspaceUri);
    });
  });

  describe('When checking for equality', () => {
    describe('When equal', () => {
      test('They are equal', () => {
        const other = Object.assign({}, defaultServerConfiguration);
        const otherConfig = new ServerConfiguration(
          other.clientConfig,
          other.clientCapability,
          other.workspaceFolder,
          other.workspaceUri,
        );

        expect(otherConfig.equal(defaultServerConfiguration)).toBe(true);
      });
    });

    describe('When not equal', () => {
      test('They are not equal', () => {
        const other = Object.assign({}, defaultServerConfiguration);
        const otherConfig = new ServerConfiguration(
          other.clientConfig,
          other.clientCapability,
          'SomeOtherFolder',
          other.workspaceUri,
        );

        expect(otherConfig.equal(defaultServerConfiguration)).toBe(false);
      });
    });
  });
});
