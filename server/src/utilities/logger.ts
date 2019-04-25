// dummy logger we may need for testing or just performance
export const mockLogger: ILogger = {
  error: (_: string) => {},
  warn: (_: string) => {},
  info: (_: string) => {},
  log: (_: string) => {},
  verbose: (_: string) => {},
};

export const mockTracer: ITracer = {
  log: (_: string, __?: string) => {},
};

export const consoleLogger: ILogger = {
  error: (message: string) => console.error(message),
  warn: (message: string) => console.warn(message),
  info: (message: string) => console.info(message),
  log: (message: string) => console.log(message),
  verbose: (message: string) => console.log(message),
};

export const consoleTracer: ITracer = {
  log: (message: string, verbose?: string) => console.trace(message, verbose),
};

// wrapper class for logger to implement logging levels
export class Logger implements ILogger {
  constructor(
    private readonly connection: ILoggerBase,
    public logLevel: LogLevel) { }

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

  log(message: string) {
    if (this.logLevel <= LogLevel.log) {
      this.connection.log(message);
    }
  }

  info(message: string) {
    if (this.logLevel <= LogLevel.info) {
      this.connection.info(message);
    }
  }

  verbose(message: string) {
    if (this.logLevel <= LogLevel.verbose) {
      this.connection.info(message);
    }
  }
}
