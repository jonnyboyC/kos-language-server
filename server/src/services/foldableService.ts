import { empty } from '../utilities/typeGuards';
import { IStack } from '../analysis/types';
import * as Stmt from '../parser/models/stmt';
import { FoldingRange, FoldingRangeKind } from 'vscode-languageserver';
import { TokenType } from '../models/tokentypes';
import { TreeTraverse } from '../utilities/treeTraverse';
import { IScript } from '../parser/types';
import { Token } from '../models/token';
import { BasicDirective } from '../directives/basicDirectives';

type RegionDirectives = BasicDirective<TokenType.region | TokenType.endRegion>;
type RegionTokens = Token<TokenType.region | TokenType.endRegion>;

/**
 * A service for identifying foldable regions inside a kerboscript
 */
export class FoldableService extends TreeTraverse {
  /**
   * result of the scan
   */
  private result: FoldingRange[];

  /**
   * Construct a foldable service
   */
  constructor() {
    super();
    this.result = [];
  }

  /**
   * Find foldable regions within a document info
   * @param script the script ast
   * @param directives the region token throughout the script
   */
  public findRegions(
    script: IScript,
    directives: RegionDirectives[],
  ): FoldingRange[] {
    this.result = [];

    for (const stmt of script.stmts) {
      this.stmtAction(stmt);
    }

    this.foldableRegions(directives);
    return [...this.result];
  }

  /**
   * Visit block statements to identify when folding regions are present
   * @param stmt block statement
   */
  public visitBlock(stmt: Stmt.Block): void {
    this.result.push({
      startCharacter: stmt.start.character,
      startLine: stmt.start.line,
      endCharacter: stmt.end.character,
      endLine: stmt.end.line,
      kind: FoldingRangeKind.Region,
    });

    for (const childStmt of stmt.stmts) {
      this.stmtAction(childStmt);
    }
  }

  /**
   * What are the foldable regions within this document using `\\ #region` and `\\ #endregion`
   * @param regions regions tokens
   */
  private foldableRegions(regions: RegionDirectives[]) {
    const regionStack: IStack<RegionTokens> = [];

    for (const region of regions) {
      if (region.directive.type === TokenType.region) {
        regionStack.push(region.directive);
      } else {
        const beginRegion = regionStack.pop();

        if (!empty(beginRegion)) {
          const endRegion = region.directive;

          this.result.push({
            startCharacter: beginRegion.start.character,
            startLine: beginRegion.start.line,
            endCharacter: endRegion.end.character,
            endLine: endRegion.end.line,
            kind: FoldingRangeKind.Region,
          });
        }
      }
    }
  }
}
