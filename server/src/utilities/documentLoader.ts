import { readFileAsync } from './fsUtils';
import { statSync, readdirSync } from 'fs';
import { join } from 'path';
import { URI } from 'vscode-uri';

/**
 * Document interface
 */
export interface Document {
  /**
   * The uri of a document
   */
  uri: string;

  /**
   * The text contained within a document
   */
  text: string;
}

/**
 * A small set of functionality for loading files and directory of files
 */
export class DocumentLoader {
  // private loadDirectoryBound: (path: string) => AsyncIterableIterator<Document>;

  constructor() {
    // this.loadDirectoryBound = this.loadDirectory.bind(this);
  }

  /**
   * Load a file from a given path
   * @param path the system path
   */
  public load(path: string): Promise<string> {
    return readFileAsync(path, 'utf-8');
  }

  /**
   * Load a collection of documents from a given directory
   * @param path the path of the directory
   */
  public async *loadDirectory(path: string): AsyncIterableIterator<Document> {
    const directoryPaths = readdirSync(path);

    for (const directoryPath of directoryPaths) {
      const dirPath = join(path, directoryPath);

      if (statSync(dirPath).isDirectory()) {
        yield* this.loadDirectory(dirPath);
      } else {
        if (dirPath.endsWith('.ks')) {
          yield {
            uri: URI.file(dirPath).toString(),
            text: await readFileAsync(dirPath, 'utf-8'),
          };
        }
      }
    }
  }
}
