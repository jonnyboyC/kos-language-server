import { IKosCommand } from './types';
// import { selectOrCreateTerminal } from './terminalUtilities';
// import { commandOnPath, platformTelnetClient, platformTelnetArguments } from './commandUtilities';
import Telnet from 'telnet-client';

const client = new Telnet();

export const runProvider: IKosCommand = {
  command: 'kos.runCurrentFile',
  commandCallback: () => {
    // const terminal = selectOrCreateTerminal('KOS Telnet');
    // terminal.show();

    // commandOnPath(platformTelnetClient())
    //   .then(
    //     (success) => {
    //       if (success) {
    //         terminal.sendText(`${platformTelnetClient()} ${platformTelnetArguments()}`);
    //       } else {
    //         terminal.sendText(`echo "${platformTelnetClient()} not found."`);
    //       }
    //       return success;
    //     },
    //     (error) => {
    //       console.log('failure');
    //       console.log(error);
    //     });
  },
};
