import { relative, join, dirname } from 'path';
import { Location } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { empty } from '../utilities/typeGuards';

/**
 * Class to resolve run statements or calls to file paths
 */
export class ResolverService {
  /**
   * The path corresponding to root of volume 0 of the kos directory
   */
  public rootVolume?: URI;

  /**
   * Create an instance of that path resolve.
   * @param rootVolume the uri associated with volume 0
   */
  constructor(rootVolume?: string) {
    this.rootVolume = !empty(rootVolume) ? URI.parse(rootVolume) : undefined;
  }

  /**
   * Is the resolve ready to resolve paths
   */
  public ready(): boolean {
    return !empty(this.rootVolume);
  }

  /**
   * Resolve path from kerboscript run statement
   * @param caller location of caller
   * @param rawPath path provided in a run statement
   */
  public resolve(caller: Location, rawPath: string): Maybe<URI> {
    if (empty(this.rootVolume)) {
      return undefined;
    }

    // get relative run path from file
    const uri = URI.parse(caller.uri);

    // currently only support file scheme
    if (uri.scheme !== 'file') {
      return undefined;
    }

    const relativePath = relative(
      this.rootVolume.toString(),
      dirname(caller.uri),
    );

    // check if the scripts reads from volume 0 "disk"
    // TODO no idea what to do for ship volumes
    const [possibleVolume, ...remaining] = rawPath.split('/');
    if (possibleVolume.startsWith('0:')) {
      // if of style 0:first\remaining...
      if (possibleVolume.length > 2) {
        const first = possibleVolume.slice(2);

        return this.toUri(first, ...remaining);
      }

      // else of style 0:\remaining...
      return this.toUri(...remaining);
    }

    if (relativePath === 'boot') {
      return this.toUri(possibleVolume, ...remaining);
    }

    // if no volume do a relative lookup
    return this.toUri(relativePath, possibleVolume, ...remaining);
  }

  /**
   * Creates a load data payload from a caller and path segments
   * @param caller call location
   * @param pathSegments path segments
   */
  private toUri(...pathSegments: string[]): Maybe<URI> {
    if (empty(this.rootVolume)) return undefined;

    return URI.file(join(this.rootVolume.fsPath, ...pathSegments));
  }
}
