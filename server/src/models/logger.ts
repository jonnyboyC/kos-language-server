import { empty } from '../utilities/typeGuards';

/**
 * A mock logger for testings or performance
 */
export const mockLogger: ILogger = {
  level: LogLevel.verbose,
  error: (_: string) => {},
  warn: (_: string) => {},
  info: (_: string) => {},
  log: (_: string) => {},
  verbose: (_: string) => {},
};

/**
 * A mock tracer for testing or performance
 */
export const mockTracer: ITracer = {
  log: (_: string, __?: string) => {},
};

/**
 * A logger to write to the standard console
 */
export const consoleLogger: ILogger = {
  level: LogLevel.verbose,
  error: (message: string) => console.error(message),
  warn: (message: string) => console.warn(message),
  info: (message: string) => console.info(message),
  log: (message: string) => console.log(message),
  verbose: (message: string) => console.log(message),
};

/**
 * A tracer to write to the standard console
 */
export const consoleTracer: ITracer = {
  log: (message: string, verbose?: string) => console.trace(message, verbose),
};

/**
 * Log an exception at the provided level to the provided logger
 * @param logger logger to write to
 * @param err exception to log
 * @param level log level to report
 */
export const logException = (
  logger: ILogger,
  tracer: ITracer,
  err: any,
  level: LogLevel,
) => {
  let method = undefined;

  switch (level) {
    case LogLevel.error:
      method = logger.error.bind(logger);
      break;
    case LogLevel.warn:
      method = logger.warn.bind(logger);
      break;
    case LogLevel.log:
      method = logger.log.bind(logger);
      break;
    case LogLevel.info:
      method = logger.info.bind(logger);
      break;
    case LogLevel.verbose:
      method = logger.verbose.bind(logger);
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

/**
 * A class to implement the logic of logging levels
 */
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
