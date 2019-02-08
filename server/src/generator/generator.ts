// import * as Decl from '../parser/declare';
// import * as Inst from '../parser/inst';
import * as Expr from '../parser/expr';

export class Generator {
  constructor(public readonly mutation: IMutation) {

  }

  public generateExpr(...exprTypes: Constructor<Expr.Expr>[]) {
    const exprClass = this.randomExpr(exprTypes.length === 0
      ? Expr.validExprTypes
      : exprTypes);

    if (exprClass) {}
  }

  // given a list of expression constructors pick one
  private randomExpr(exprTypes: Constructor<Expr.Expr>[]): Constructor<Expr.Expr> {
    const index = getRandomInt(exprTypes.length);
    return exprTypes[index];
  }
}
