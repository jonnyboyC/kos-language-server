import { readFile, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { getUri } from 'get-uri';

getUri.

export const readFileAsync = (path: string, encoding: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    readFile(path, { encoding }, (err, data) => {
      if (err) {
        reject(err);
      }

      resolve(data);
    });
  });
};

export const walkDir = (dir: string, callback: (fileName: string) => void): void => {
  readdirSync(dir).forEach((f) => {
    const dirPath = join(dir, f);
    const isDirectory = statSync(dirPath).isDirectory();
    isDirectory ?
      walkDir(dirPath, callback) : callback(join(dir, f));
  });
};
