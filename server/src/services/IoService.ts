import { readFileAsync } from '../utilities/fsUtils';
import { statSync, readdirSync, existsSync, lstatSync } from 'fs';
import { join, dirname } from 'path';
import { URI } from 'vscode-uri';
import { normalizeExtensions } from '../utilities/pathUtils';
import { empty } from '../utilities/typeGuards';

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
 * What kinda of entity is this
 */
export enum IoKind {
  /**
   * The io entity is a file
   */
  file,

  /**
   * The io entity is a directory
   */
  directory,
}

/**
 * What is the io entity that is found
 */
export interface IoEntity {
  /**
   * What is the uri of this entity
   */
  uri: URI;

  /**
   * WHat is the kind of this entity
   */
  kind: IoKind;
}

/**
 * A small set of functionality for loading files and directory of files
 */
export class IoService {
  constructor() {}

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

  /**
   * Check if the uri exists. Performs a normalization step in cases of
   * `runPath("0:\script")` where the .ks is omitted
   * @param caller location of caller
   * @param rawPath path provided in a run statement
   */
  public exists(uri: URI): Maybe<URI> {
    // check if file exists then
    if (existsSync(uri.fsPath)) {
      return uri;
    }

    // if we didn't find try to normalize the path with extension .ks
    const result = normalizeExtensions(uri);
    if (empty(result)) {
      return undefined;
    }

    const normalized = URI.parse(result);
    if (!existsSync(normalized.fsPath)) {
      return undefined;
    }

    return normalized;
  }

  /**
   * What entities are in the relevant directory
   * @param uri The uri of the request
   */
  public statDirectory(uri: URI): IoEntity[] {
    const { fsPath } = uri;

    const isDirectory = existsSync(fsPath) && lstatSync(fsPath).isDirectory();
    const directory = isDirectory ? fsPath : dirname(fsPath);

    // check if file exists then
    if (!existsSync(directory)) {
      return [];
    }

    const files = readdirSync(directory);

    const entities: IoEntity[] = [];
    for (const file of files) {
      const path = join(directory, file);

      entities.push({
        uri: URI.file(join(directory, file)),
        kind: statSync(path).isDirectory() ? IoKind.directory : IoKind.file,
      });
    }

    return entities;
  }
}
