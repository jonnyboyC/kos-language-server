// dummy logger we may need for testing or just performance
export const mockLogger: ILogger = {
  error: (_: string) => {},
  warn: (_: string) => {},
  info: (_: string) => {},
  log: (_: string) => {},
  verbose: (_: string) => {},
};

export const mockTracer: ITracer = {
  // tslint:disable-next-line:variable-name
  log: (_message: string, _verbose?: string) => {},
};

// wrapper class for logger to implement logging levels
export class Logger implements ILogger {
  constructor(
    private readonly connection: ILoggerBase,
    public logLevel: LogLevel) { }

  verbose(message: string) {
    if (this.logLevel <= LogLevel.verbose) {
      this.connection.info(message);
    }
  }

  log(message: string) {
    if (this.logLevel <= LogLevel.log) {
      this.connection.log(message);
    }
  }

  error(message: string) {
    if (this.logLevel <= LogLevel.error) {
      this.connection.error(message);
    }
  }

  warn(message: string) {
    if (this.logLevel <= LogLevel.warn) {
      this.connection.warn(message);
    }
  }

  info(message: string) {
    if (this.logLevel <= LogLevel.info) {
      this.connection.info(message);
    }
  }
}
