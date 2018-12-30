import { readFile } from 'fs';

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
