import { empty } from '../utilities/typeGuards';
import { IStack } from '../analysis/types';
import * as Stmt from '../parser/models/stmt';
import { FoldingRange, FoldingRangeKind } from 'vscode-languageserver';
import { Token } from '../models/token';
import { TokenType } from '../models/tokentypes';
import { TreeTraverse } from '../utilities/treeTraverse';
import { IScript } from '../parser/types';
import { Directive } from '../scanner/types';

type RegionTokens = Token<TokenType.region | TokenType.endRegion>;

/**
 * Is the directive a region directive
 * @param directive directive in question
 */
export const regionDirectives = (
  directive: Directive<Token>,
): directive is Directive<RegionTokens> => {
  switch (directive.directive.type) {
    case TokenType.region:
    case TokenType.endRegion:
      return true;
    default:
      return false;
  }
};

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
    directives: Directive<RegionTokens>[],
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
  private foldableRegions(regions: Directive<RegionTokens>[]) {
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
