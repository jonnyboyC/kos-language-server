import { IKosCommand } from './types';
import { selectOrCreateTerminal } from './terminalUtilities';
import { commandOnPath, platformTelnetClient, platformTelnetArguments } from './commandUtilities';
import { window, workspace } from 'vscode';

export const telnetProvider: IKosCommand = {
  command: 'kos.startTelnet',
  commandCallback: async () => {
    try {
      // get configuration
      const configruation = workspace.getConfiguration('kos-vscode');

      // get terminal
      const terminal = selectOrCreateTerminal('kOS vscode');

      // determine host and port
      const configHost = configruation.get<string | null>('telnetHost');
      const configPort = configruation.get<number | null>('telnetPort');

      const host = configHost || '127.0.0.1';
      const port = configPort || 5410;

      const platformTelnet = platformTelnetClient();
      const telnetAvailable = await commandOnPath(platformTelnet);

      // if telnet is available use it
      if (telnetAvailable) {
        terminal.sendText(`${platformTelnet} ${platformTelnetArguments(host, port)}`);

      // else report warning
      } else {
        window.showWarningMessage(`Unable to find ${platformTelnet} on the path`);
      }

    } catch (e) {
      console.log(e);
    }
  },
};
