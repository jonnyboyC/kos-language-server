import { IKosCommand } from './types';
// tslint:disable-next-line:import-name
import Telnet from 'telnet-client';

const client = new Telnet();

export const runProvider: IKosCommand = {
  command: 'kos.runCurrentFile',
  commandCallback: async () => {
    try {
      const result = await client.connect({
        timeout: 3000,
        host: '127.0.0.1',
        port: 5410,
        shellPrompt: '>',
      });

      console.log(result);

      await client.exec('1');
      await client.exec('fart');
    } catch (e) {
      console.log(e);
    }
  },
};
