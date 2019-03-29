/// <reference types="node" />
import { EventEmitter } from 'events'
import { Duplex, DuplexOptions, Stream } from 'stream'
import { Socket } from 'net';

type NodeCallback<T> = (error: any, value: T) => void;

export = Telnet;
declare class Telnet extends EventEmitter {
  host?: string;
  port?: number;
  timeout?: number;
  shellPrompt?: string | RegExp;
  loginPrompt?: string | RegExp;
  passwordPrompt?: string | RegExp;
  failedLoginMatch: any;
  loginPromptReceived?: boolean;
  extSock?: Socket
  sock: Socket | null;
  state: 'standby' 
    | 'ready' 
    | 'start' 
    | 'response' 
    | 'login' 
    | 'getprompt'
    | 'failedLogin' 
    | null;
  debug?: boolean;
  username?: string;
  password?: string;
  irs?: string;
  ors?: string;
  echoLines?: number;
  stripShellPrompt?: boolean;
  pageSeparator?: string;
  negotiationMandatory?: boolean;
  initialLFCR?: boolean;
  execTimeout?: number;
  sendTimeout?: number;
  maxBufferLength?: number;

  constructor();
  connect(opts: Telnet.ITelnetOptions): Promise<string>;
  shell(callback?: NodeCallback<Stream>): Promise<Stream>;
  exec(
    cmd: string,
    opts?: Telnet.ITelnetOptions | NodeCallback<string>,
    callback?: NodeCallback<string>): Promise<string>
  send(
    data: any, 
    opts?: Telnet.ITelnetOptions | NodeCallback<string>, 
    callback?: NodeCallback<string>): Promise<string>;
  getSocket(): Socket | null;
  end(): Promise<void>;
  destroy(): Promise<void>
  _parseDate(
    chunk: string[],
    callback?: (temp: string, shellPrompt: string | RegExp) => any): boolean | undefined;
  _login(hanlde: string): void;
  _negotiate<T>(chunk: T[]): T | undefined;
  _checkSocket(sock: Socket): boolean;
}
declare namespace Telnet {
  interface ITelnetOptions {
    host?: string;
    port?: number;
    timeout?: number;
    shellPrompt?: string | RegExp;
    loginPrompt?: string | RegExp;
    passwordPrompt?: string | RegExp;
    sock?: Socket;
    debug?: boolean;
    username?: string;
    password?: string;
    irs?: string;
    ors?: string;
    echoLines?: number;
    stripShellPrompt?: boolean;
    pageSeparator?: string;
    negotiationMandatory?: boolean;
    initialLFCR?: boolean;
    execTimeout?: number;
    sendTimeout?: number;
    maxBufferLength?: number;
  }
}
