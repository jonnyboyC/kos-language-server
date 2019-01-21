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

export const mockTracer: ITracer = {
  // tslint:disable-next-line:variable-name
  log: (_message: string, _verbose?: string) => {},
};

// wrapper class for logger to implement logging levels
export class Logger implements ILogger {
  constructor(
    private readonly connection: ILogger,
    public logLevel: LogLevel) { }

  log(message: string) {
    if (this.logLevel <= LogLevel.Log) {
      this.connection.log(message);
    }
  }

  error(message: string) {
    if (this.logLevel <= LogLevel.Error) {
      this.connection.error(message);
    }
  }

  warn(message: string) {
    if (this.logLevel <= LogLevel.Warn) {
      this.connection.warn(message);
    }
  }

  info(message: string) {
    if (this.logLevel <= LogLevel.Info) {
      this.connection.info(message);
    }
  }
}
