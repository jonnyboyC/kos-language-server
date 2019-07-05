import { readFile, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { getUri } from 'get-uri';
import { empty } from './typeGuards';

/**
 * Read a resource using the get-uri api
 * @param uri uri to resource
 */
export const retrieveUriAsync = (uri: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    getUri(uri, {}, (err, rs) => {
      if (empty(rs)) {
        reject(err);
        return;
      }

      let result = '';

      // accumulate chunks of data
      rs.on('data', (chunk) => {
        if (typeof chunk === 'string') {
          result += chunk;
        } else {
          reject(new Error('Unable to read none string resources'));
        }
      });

      // signal end of stream resolve
      rs.on('end', () => {
        resolve(result);
      });
    });
  });
};

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
