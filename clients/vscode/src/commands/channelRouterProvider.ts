import { IKosCommand } from './types';
import { workspace, OutputChannel, window } from 'vscode';
// tslint:disable-next-line: import-name
import WebSocket from 'ws';

/**
 * Output channel types
 */
const enum OutputChannelKind {
  /**
   * route output to the default vscode output channel
   */
  vscode,

  /**
   * route output to a websocket connection
   */
  websocket,
}

/**
 * Class to handle routing the output channel to the appropciate location
 */
class KosOutputChannel implements OutputChannel {
  public readonly name: string;

  /**
   * Channel to send output to
   */
  public output: OutputChannelKind;

  /**
   * Websocket connection
   */
  public socket?: WebSocket;

  /**
   * Vscode output channel
   */
  private defaultChannel: OutputChannel;

  /**
   * Temporary output cache
   */
  private log: string;

  /**
   * Kos output channel constructor
   * @param name name of the output channel
   */
  constructor(name: string) {
    this.name = name;
    this.defaultChannel = window.createOutputChannel(name);
    this.output = OutputChannelKind.vscode;
    this.log = '';
    this.socket = undefined;
  }

  append(value: string): void {
    this.log += value;
    switch (this.output) {
      case OutputChannelKind.websocket:
        if (
          this.socket !== undefined &&
          this.socket.readyState === WebSocket.OPEN
        ) {
          this.socket.send(this.log);
          break;
        }
        this.defaultChannel.append(value);
        break;
      case OutputChannelKind.vscode:
        this.defaultChannel.append(value);
    }
  }

  appendLine(value: string): void {
    this.log += value;
    switch (this.output) {
      case OutputChannelKind.websocket:
        if (
          this.socket !== undefined &&
          this.socket.readyState === WebSocket.OPEN
        ) {
          this.socket.send(this.log);
          break;
        }
        this.defaultChannel.appendLine(value);
        break;
      case OutputChannelKind.vscode:
        this.defaultChannel.appendLine(value);
    }
    this.log = '';
  }

  clear(): void {
    this.defaultChannel.clear();
  }

  show(): void {
    this.defaultChannel.show();
  }

  hide(): void {
    this.defaultChannel.hide();
  }

  dispose(): void {
    this.defaultChannel.dispose();
    if (this.socket !== undefined) {
      this.socket.close();
      this.socket.terminate();
      this.socket = undefined;
    }
  }

  /**
   * Route output to a websocket port
   * @param port port number
   */
  public routeSocket(port: number) {
    this.socket = new WebSocket(`ws://localhost:${port}`);
    this.output = OutputChannelKind.websocket;
  }

  /**
   * Route output to vscode
   */
  public routeVscode() {
    this.output = OutputChannelKind.vscode;
    this.closeSocket();
  }

  /**
   * close the websocket connection
   */
  private closeSocket(): void {
    if (this.socket !== undefined) {
      this.socket.close();
      this.socket.terminate();
      this.socket = undefined;
    }
  }
}

export const channelRouter = new KosOutputChannel('kOS (Kerboscript)');

export const inspectorChannelProvider: IKosCommand = {
  command: 'kos.startLspLog',
  commandCallback: async () => {
    try {
      // get configuration
      const configuration = workspace.getConfiguration('kos-vscode');

      // determine host and port
      const lspPort = configuration.get('lspPort', 7000);

      // create websocket
      channelRouter.routeSocket(lspPort);
    } catch (e) {
      console.log(e);
    }
  },
};

export const vscodeChannelProvider: IKosCommand = {
  command: 'kos.startVscodeLog',
  commandCallback: async () => {
    try {
      channelRouter.routeVscode();
    } catch (e) {
      console.log(e);
    }
  },
};
