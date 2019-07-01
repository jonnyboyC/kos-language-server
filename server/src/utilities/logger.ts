import { empty } from "./typeGuards";

// dummy logger we may need for testing or just performance
export const mockLogger: ILogger = {
  level: LogLevel.verbose,
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
  level: LogLevel.verbose,
  error: (message: string) => console.error(message),
  warn: (message: string) => console.warn(message),
  info: (message: string) => console.info(message),
  log: (message: string) => console.log(message),
  verbose: (message: string) => console.log(message),
};

export const consoleTracer: ITracer = {
  log: (message: string, verbose?: string) => console.trace(message, verbose),
};

/**
 * Log an exception at the provided level to the provided logger
 * @param logger logger to write to
 * @param err exception to log
 * @param level log level to report
 */
export const logException = (logger: ILogger, tracer: ITracer, err: any, level: LogLevel) => {
  let method = undefined;

  switch (level) {
    case LogLevel.error:
      method = logger.error;
      break;
    case LogLevel.warn:
      method = logger.warn;
      break;
    case LogLevel.log:
      method = logger.log;
      break;
    case LogLevel.info:
      method = logger.info;
      break;
    case LogLevel.verbose:
      method = logger.verbose;
      break;
    case LogLevel.none:
      return;
    default:
      throw new Error('Unknown log level');
  }

  if (typeof err === 'string') {
    method(err);
    tracer.log(err);
    return;
  }

  if (err instanceof Error) {
    method(`${err.name} ${err.message}`);
    if (!empty(err.stack)) {
      method(err.stack);
    }
    tracer.log(err.name);
  }
};

// wrapper class for logger to implement logging levels
export class Logger implements ILogger {
  constructor(
    private readonly connection: ILoggerBase,
    public level: LogLevel,
  ) {}

  error(message: string) {
    if (this.level <= LogLevel.error) {
      this.connection.warn(message);
    }
  }

  warn(message: string) {
    if (this.level <= LogLevel.warn) {
      this.connection.warn(message);
    }
  }

  log(message: string) {
    if (this.level <= LogLevel.log) {
      this.connection.log(message);
    }
  }

  info(message: string) {
    if (this.level <= LogLevel.info) {
      this.connection.info(message);
    }
  }

  verbose(message: string) {
    if (this.level <= LogLevel.verbose) {
      this.connection.info(message);
    }
  }
}
