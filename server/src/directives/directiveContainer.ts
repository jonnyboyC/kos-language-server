import { Include } from './include';
import { BasicDirective } from './basicDirectives';
import { TokenType } from '../models/tokentypes';

/**
 * Available directives is kos-language-server
 */
export interface DirectiveContainer {
  /**
   * Include directives for have kls act like a file has been run
   */
  include: Include[];

  /**
   * Region directives for indicating the beginning of a foldable region
   */
  region: BasicDirective<TokenType.region>[];

  /**
   * End region directives for indicating the end of a foldable region
   */
  endRegion: BasicDirective<TokenType.endRegion>[];
}
