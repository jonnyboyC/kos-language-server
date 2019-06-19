declare module 'get-uri' {
  import { Readable } from "stream";
  import { ReadStream, open, fstat } from 'fs';
  import dataUriTOBuffer from 'data-uri-to-buffer';

  export interface NotFoundError extends Error {
    name: 'NotFoundError';
    code: 'ENOTFOUND';
    message: string;
  }

  export interface NotModifiedError extends Error {
    name: 'NotModifiedError';
    code: 'ENOTMODIFIED';
    message: string;
  }

  type DataUriOptions = any;
  type DataUriCallback = (err: null | NotModifiedError, rs: Readable) => void;

  type FileUriOptions = {
    flags?: string | number;
    mode?: string | number | null
    cache?: Readable;
  }
  type FileUriCallback = (err: NodeJS.ErrnoException | NotFoundError | NotModifiedError, rs: Readable) => void;

  type FtpUriOptions = {
    flags?: string | number;
    mode?: string | number | null
    cache?: Readable;
  }
  type FtpUriCallback = (err: NodeJS.ErrnoException | NotFoundError | NotModifiedError, rs: Readable) => void;

  export function getUri(uri: string, opts: DataUriOptions, fn?: DataUriCallback): void;
  export function getUri(uri: string, opts: FileUriOptions, fn?: FileUriCallback): void;
}
