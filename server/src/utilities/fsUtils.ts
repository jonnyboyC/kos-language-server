import { readdirSync, statSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

/**
 * Wrap the node read file in a promise
 * @param path path of the file to read
 * @param encoding the file encoding
 */
export const readFileAsync = (
  path: string,
  encoding: BufferEncoding,
): Promise<string> => {
  return readFile(path, encoding);
};

/**
 * Walk a directory of files
 * @param dir directory to walk
 * @param callback callback for each file in the directory
 */
export const walkDir = (
  dir: string,
  callback: (fileName: string) => void,
): void => {
  readdirSync(dir).forEach(f => {
    const dirPath = join(dir, f);
    const isDirectory = statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(join(dir, f));
  });
};
