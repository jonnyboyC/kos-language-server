import { IKosCommand } from './types';
// tslint:disable-next-line:import-name
import Telnet from 'telnet-client';

const client = new Telnet();

client.on('connect', () => {
  console.log('connect');
});

client.on('ready', (data) => {
  console.log('ready', data.toString());
});

client.on('writedone', () => {
  console.log('writedone');
});

client.on('writedone', () => {
  console.log('writedone');
});

client.on('data', (data) => {
  console.log('data', data.toString());
});

client.on('timeout', () => {
  console.log('timeout');
});

client.on('error', () => {
  console.log('error');
});

client.on('end', () => {
  console.log('end');
});

client.on('close', () => {
  console.log('close');
});

export const runProvider: IKosCommand = {
  command: 'kos.runCurrentFile',
  commandCallback: async () => {
    try {
      if (client.state == null) {
        await client.connect({
          timeout: 30000,
          host: '127.0.0.1',
          port: 5410,
          shellPrompt: '>',
          echoLines: 0,
        });
      }

      const thing = await client.exec('1\r\n', { timeout: 30000, shellPrompt: '����' });

      console.log(thing);
    } catch (e) {
      console.log(e);
    }
  },
};
