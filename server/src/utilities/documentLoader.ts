import { readFileAsync } from './fsUtils';

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
   * @param _ the path of the directory
   */
  public loadDirectory(_: string): Promise<Document[]> {
    return Promise.resolve([]);
  }
}
