import { IKosCommand } from './types';
import { platformKsp } from './commandUtilities';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { window, workspace } from 'vscode';

export const kspProvider: IKosCommand = {
  command: 'kos.startksp',
  commandCallback: () => {
    // get configuration
    const configruation = workspace.getConfiguration('kos-vscode');

    const configPath = configruation.get<string | null>('kerbalSpaceProgramPath');
    const path = configPath || platformKsp();

    if (existsSync(path)) {
      spawn(path, {
        detached: true,
        stdio: 'ignore',
      }).unref();
    } else {
      window.showWarningMessage(`Unable to find Kerbal Space Program here ${path}`);
    }
  },
};
