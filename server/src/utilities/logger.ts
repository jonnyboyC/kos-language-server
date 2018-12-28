import { RemoteConsole } from 'vscode-languageserver';

export class ConnectionLogger implements ILogger {
  constructor(public readonly console: RemoteConsole) {}

  error(message: string): void {
    this.console.error(message);
  }
  warn(message: string): void {
    this.console.warn(message);
  }
  info(message: string): void {
    this.info(message);
  }
  log(message: string): void {
    this.log(message);
  }
}

// dummy logger we may need for testing or just performance
export const mockLogger: ILogger = {
  // tslint:disable-next-line:variable-name
  error: (_message: string) => {},

  // tslint:disable-next-line:variable-name
  warn: (_message: string) => {},

  // tslint:disable-next-line:variable-name
  info: (_message: string) => {},

  // tslint:disable-next-line:variable-name
  log: (_message: string) => {},
};
