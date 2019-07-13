import { IDocumentInfo } from '../types';
import { empty } from '../utilities/typeGuards';
import { IStack } from '../analysis/types';
import * as Stmt from '../parser/stmt';
import { FoldingRange, FoldingRangeKind } from 'vscode-languageserver';
import { Token } from '../entities/token';
import { TokenType } from '../entities/tokentypes';
import { TreeTraverse } from '../parser/treeTraverse';

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
   */
  public findRegions(documentInfo: IDocumentInfo): FoldingRange[] {
    const { regions, script } = documentInfo;

    this.result = [];

    for (const stmt of script.stmts) {
      this.stmtAction(stmt);
    }

    this.foldableRegions(regions);
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
  private foldableRegions(regions: Token[]) {
    const regionStack: IStack<Token> = [];

    for (const region of regions) {
      if (region.type === TokenType.region) {
        regionStack.push(region);
      } else {
        const beginRegion = regionStack.pop();

        if (!empty(beginRegion)) {
          this.result.push({
            startCharacter: beginRegion.start.character,
            startLine: beginRegion.start.line,
            endCharacter: region.end.character,
            endLine: region.end.line,
            kind: FoldingRangeKind.Region,
          });
        }
      }
    }
  }
}
