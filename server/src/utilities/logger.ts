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
