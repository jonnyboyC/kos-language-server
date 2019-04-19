import { IKosCommand } from './types';
import { workspace, OutputChannel } from 'vscode';
import WebSocket from 'ws';

let log = '';
let socket: WebSocket | undefined = undefined;

export const websocketOutputChannel: OutputChannel = {
  name: 'websocket',
  append(value: string) {
    log += value;
  },
  appendLine(value: string) {
    log += value;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(log);
    } 

    log = '';
  },
  clear() {},
  show() {},
  hide() {},
  dispose() {},
}

export const inspectorProvider: IKosCommand = {
  command: 'kos.lspLog',
  commandCallback: async () => {
    try {
      // get configuration
      const configruation = workspace.getConfiguration('kos-vscode');

      // determine host and port
      const lspPort = configruation.get('lspPort', 7000);

      // create websocket
      socket = new WebSocket(`ws://localhost:${lspPort}`)
    } catch (e) {
      console.log(e);
    }
  },
};
