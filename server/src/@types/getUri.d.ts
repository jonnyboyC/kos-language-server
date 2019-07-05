declare module 'get-uri' {
  import { Readable } from "stream";
  import { ReadStream, open, fstat } from 'fs';
  import https from 'https';

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
    cache?: Readable
  } | any;
  type FtpUriCallback = (err: any, rs: Readable) => void;

  type HttpUriOptions = {
    http?: typeof https;
    redirects?: any[];
    maxRedirects?: number
    cache?: Readable
  };
  type HttpUriCallback = (err: any, rs: Readable) => void;

  export type GetUriCallback = (err?: any, rs?: Readable) => void;

  // export function getUri(uri: string, opts: DataUriOptions, fn?: DataUriCallback): void;
  // export function getUri(uri: string, opts: FileUriOptions, fn?: FileUriCallback): void;
  // export function getUri(uri: string, opts: FtpUriOptions, fn?: FtpUriCallback): void;
  // export function getUri(uri: string, opts: HttpUriOptions, fn?: HttpUriCallback): void;
  export function getUri(uri: string, fn: GetUriCallback): void;
  export function getUri(uri: string, opts: {}, fn: GetUriCallback): void;
}
