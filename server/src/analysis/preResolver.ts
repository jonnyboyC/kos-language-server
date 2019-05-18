import {
  IInstVisitor,
  IExprVisitor,
  IInst,
  ScopeKind,
  IExpr,
  ISuffixTerm,
  ISuffixTermVisitor,
  IScript,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Inst from '../parser/inst';
import { Var, Lock, Func, Param } from '../parser/declare';
import { empty } from '../utilities/typeGuards';
import { TokenType } from '../entities/tokentypes';
import { mockLogger, mockTracer } from '../utilities/logger';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { Diagnostic } from 'vscode-languageserver';
import { FunctionScan } from './functionScan';

export type Diagnostics = Diagnostic[];

/**
 * The pre resolver run prior to the resolver. Its main purpose is to
 * find and store function declaration location of functions is kerboscripts
 * does not matter.
 */
export class PreResolver
  implements
    IExprVisitor<Diagnostics>,
    IInstVisitor<Diagnostics>,
    ISuffixTermVisitor<Diagnostics> {

  /**
   * current script being processed
   */
  private script: IScript;

  /**
   * symbol table builder
   */
  private tableBuilder: SymbolTableBuilder;

  /**
   * logger
   */
  private readonly logger: ILogger;

  /**
   * tracer
   */
  private readonly tracer: ITracer;

  /**
   * function scan to find parameters and return
   * instructions
   */
  private readonly functionScan: FunctionScan;

  /**
   * Pre resolver constructor
   * @param script pre resolver script
   * @param symbolTableBuilder symbol table builder
   * @param logger logger
   * @param tracer tracer
   */
  constructor(
    script: IScript,
    symbolTableBuilder: SymbolTableBuilder,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
  ) {
    this.script = script;
    this.tableBuilder = symbolTableBuilder;
    this.logger = logger;
    this.tracer = tracer;
    this.functionScan = new FunctionScan();
  }

  /**
   * Perform an initial resolver pass on the script instructions,
   * for function declarations
   */
  public resolve(): Diagnostics {
    try {
      const splits = this.script.uri.split('/');
      const file = splits[splits.length - 1];

      this.logger.info(`Function Resolving started for ${file}.`);

      this.tableBuilder.rewind();
      this.tableBuilder.beginScope(this.script);

      const resolveErrors = this.resolveInsts(this.script.insts);
      this.tableBuilder.endScope();

      this.logger.info(`Function Resolving finished for ${file}`);

      if (resolveErrors.length) {
        this.logger.warn(
          `Function Resolver encounted ${resolveErrors.length} errors`,
        );
      }

      return resolveErrors;
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      this.tracer.log(err);

      return [];
    }
  }

  // resolve the given set of instructions
  public resolveInsts(insts: IInst[]): Diagnostics {
    return accumulateErrors(insts, this.resolveInst.bind(this));
  }

  // resolve for an instruction
  private resolveInst(inst: IInst): Diagnostics {
    return inst.accept(this);
  }

  // resolve for an expression
  private resolveExpr(expr: IExpr): Diagnostics {
    return expr.accept(this);
  }

  // resolve for an expression
  private resolveSuffixTerm(suffixTerm: ISuffixTerm): Diagnostics {
    return suffixTerm.accept(this);
  }

  /* --------------------------------------------

  Declarations

  ----------------------------------------------*/

  // check variable declaration
  public visitDeclVariable(decl: Var): Diagnostics {
    return this.resolveExpr(decl.value);
  }

  // check lock declaration
  public visitDeclLock(decl: Lock): Diagnostics {
    return this.resolveExpr(decl.value);
  }

  /**
   * Because function don't need forward declaration in kerboscript
   * we need to find and add their symbols first
   * @param decl function declaration
   */
  public visitDeclFunction(decl: Func): Diagnostics {
    const scopeToken = decl.scope && decl.scope.scope;

    let scopeType: ScopeKind;

    // functions are default global at file scope and local everywhere else
    if (empty(scopeToken)) {
      scopeType = this.tableBuilder.isFileScope()
        ? ScopeKind.global
        : ScopeKind.local;
    } else {
      switch (scopeToken.type) {
        case TokenType.local:
          scopeType = ScopeKind.local;
          break;
        case TokenType.global:
          scopeType = ScopeKind.global;
          break;
        default:
          throw new Error(
            'Unexpected scope token encountered. Expected local or global.',
          );
      }
    }

    const result = this.functionScan.scan(decl.block);
    const declareErrors = this.tableBuilder.declareFunction(
      scopeType,
      decl.identifier,
      result.requiredParameters,
      result.optionalParameters,
      result.return,
    );
    const instErrors = this.resolveInst(decl.block);

    return empty(declareErrors)
      ? instErrors
      : instErrors.concat(declareErrors);
  }

  // check parameter declaration
  public visitDeclParameter(_: Param): Diagnostics {
    return [];
  }

  /* --------------------------------------------

  Instructions

  ----------------------------------------------*/

  public visitInstInvalid(_: Inst.Invalid): Diagnostics {
    return [];
  }

  public visitBlock(inst: Inst.Block): Diagnostics {
    this.tableBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    this.tableBuilder.endScope();

    return errors;
  }

  public visitExpr(inst: Inst.ExprInst): Diagnostics {
    return this.resolveExpr(inst.suffix);
  }

  public visitOnOff(inst: Inst.OnOff): Diagnostics {
    return this.resolveExpr(inst.suffix);
  }

  public visitCommand(_: Inst.Command): Diagnostics {
    return [];
  }

  public visitCommandExpr(inst: Inst.CommandExpr): Diagnostics {
    return this.resolveExpr(inst.expr);
  }

  public visitUnset(_: Inst.Unset): Diagnostics {
    return [];
  }

  public visitUnlock(_: Inst.Unlock): Diagnostics {
    return [];
  }

  public visitSet(inst: Inst.Set): Diagnostics {
    return this.resolveExpr(inst.value);
  }

  public visitLazyGlobal(_: Inst.LazyGlobal): Diagnostics {
    return [];
  }

  public visitIf(inst: Inst.If): Diagnostics {
    let resolveErrors = this.resolveExpr(inst.condition).concat(
      this.resolveInst(inst.ifInst),
    );

    if (inst.elseInst) {
      resolveErrors = resolveErrors.concat(this.resolveInst(inst.elseInst));
    }

    return resolveErrors;
  }

  public visitElse(inst: Inst.Else): Diagnostics {
    return this.resolveInst(inst.inst);
  }

  public visitUntil(inst: Inst.Until): Diagnostics {
    return this.resolveExpr(inst.condition).concat(this.resolveInst(inst.inst));
  }

  public visitFrom(inst: Inst.From): Diagnostics {
    return this.resolveInsts(inst.initializer.insts).concat(
      this.resolveExpr(inst.condition),
      this.resolveInsts(inst.increment.insts),
      this.resolveInst(inst.inst),
    );
  }

  public visitWhen(inst: Inst.When): Diagnostics {
    return this.resolveExpr(inst.condition).concat(this.resolveInst(inst.inst));
  }

  public visitReturn(inst: Inst.Return): Diagnostics {
    if (inst.expr) {
      return this.resolveExpr(inst.expr);
    }

    return [];
  }

  public visitBreak(_: Inst.Break): Diagnostics {
    return [];
  }

  public visitSwitch(inst: Inst.Switch): Diagnostics {
    return this.resolveExpr(inst.target);
  }

  public visitFor(inst: Inst.For): Diagnostics {
    return this.resolveExpr(inst.collection).concat(this.resolveInst(inst.inst));
  }

  public visitOn(inst: Inst.On): Diagnostics {
    return this.resolveExpr(inst.suffix).concat(this.resolveInst(inst.inst));
  }

  public visitToggle(inst: Inst.Toggle): Diagnostics {
    return this.resolveExpr(inst.suffix);
  }

  public visitWait(inst: Inst.Wait): Diagnostics {
    return this.resolveExpr(inst.expr);
  }

  public visitLog(inst: Inst.Log): Diagnostics {
    return this.resolveExpr(inst.expr).concat(this.resolveExpr(inst.target));
  }

  public visitCopy(inst: Inst.Copy): Diagnostics {
    return this.resolveExpr(inst.target).concat(
      this.resolveExpr(inst.destination),
    );
  }

  public visitRename(inst: Inst.Rename): Diagnostics {
    return this.resolveExpr(inst.target).concat(
      this.resolveExpr(inst.alternative),
    );
  }

  public visitDelete(inst: Inst.Delete): Diagnostics {
    if (empty(inst.volume)) {
      return this.resolveExpr(inst.target);
    }

    return this.resolveExpr(inst.target).concat(this.resolveExpr(inst.volume));
  }

  public visitRun(inst: Inst.Run): Diagnostics {
    if (empty(inst.args)) {
      return [];
    }

    return accumulateErrors(inst.args, this.resolveExpr.bind(this));
  }

  public visitRunPath(inst: Inst.RunPath): Diagnostics {
    if (empty(inst.args)) {
      return this.resolveExpr(inst.expr);
    }

    return this.resolveExpr(inst.expr).concat(
      accumulateErrors(inst.args, this.resolveExpr.bind(this)),
    );
  }

  public visitRunPathOnce(inst: Inst.RunPathOnce): Diagnostics {
    if (empty(inst.args)) {
      return this.resolveExpr(inst.expr);
    }

    return this.resolveExpr(inst.expr).concat(
      accumulateErrors(inst.args, this.resolveExpr.bind(this)),
    );
  }

  public visitCompile(inst: Inst.Compile): Diagnostics {
    if (empty(inst.destination)) {
      return this.resolveExpr(inst.target);
    }

    return this.resolveExpr(inst.target).concat(
      this.resolveExpr(inst.destination),
    );
  }

  public visitList(_: Inst.List): Diagnostics {
    return [];
  }

  public visitEmpty(_: Inst.Empty): Diagnostics {
    return [];
  }

  public visitPrint(inst: Inst.Print): Diagnostics {
    return this.resolveExpr(inst.expr);
  }

  /* --------------------------------------------

  Expressions

  ----------------------------------------------*/

  public visitExprInvalid(_: Expr.Invalid): Diagnostics {
    return [];
  }

  public visitBinary(expr: Expr.Binary): Diagnostics {
    return this.resolveExpr(expr.left).concat(this.resolveExpr(expr.right));
  }

  public visitUnary(expr: Expr.Unary): Diagnostics {
    return this.resolveExpr(expr.factor);
  }

  public visitFactor(expr: Expr.Factor): Diagnostics {
    return this.resolveExpr(expr.suffix).concat(
      this.resolveExpr(expr.exponent),
    );
  }

  public visitSuffix(expr: Expr.Suffix): Diagnostics {
    const suffixTerm = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return suffixTerm;
    }

    return suffixTerm.concat(this.resolveSuffixTerm(expr.trailer));
  }

  public visitLambda(expr: Expr.Lambda): Diagnostics {
    return this.resolveInst(expr.block);
  }

  /* --------------------------------------------

  Suffix Terms

  ----------------------------------------------*/

  public visitSuffixTermInvalid(_: SuffixTerm.Invalid): Diagnostics {
    return [];
  }

  public visitSuffixTrailer(expr: SuffixTerm.SuffixTrailer): Diagnostics {
    const suffixTerm = this.resolveSuffixTerm(expr.suffixTerm);
    if (empty(expr.trailer)) {
      return suffixTerm;
    }

    return suffixTerm.concat(this.resolveSuffixTerm(expr.trailer));
  }

  public visitSuffixTerm(expr: SuffixTerm.SuffixTerm): Diagnostics {
    let errors = this.resolveSuffixTerm(expr.atom);
    for (const trailer of expr.trailers) {
      errors = errors.concat(this.resolveSuffixTerm(trailer));
    }

    return errors;
  }

  public visitCall(expr: SuffixTerm.Call): Diagnostics {
    return accumulateErrors(expr.args, this.resolveExpr.bind(this));
  }

  public visitArrayIndex(_: SuffixTerm.ArrayIndex): Diagnostics {
    return [];
  }

  public visitArrayBracket(expr: SuffixTerm.ArrayBracket): Diagnostics {
    return this.resolveExpr(expr.index);
  }

  public visitDelegate(_: SuffixTerm.Delegate): Diagnostics {
    return [];
  }

  public visitLiteral(_: SuffixTerm.Literal): Diagnostics {
    return [];
  }

  public visitIdentifier(_: SuffixTerm.Identifier): Diagnostics {
    return [];
  }

  public visitGrouping(expr: SuffixTerm.Grouping): Diagnostics {
    return this.resolveExpr(expr.expr);
  }
}

const accumulateErrors = <T>(
  items: T[],
  checker: (item: T) => Diagnostics,
): Diagnostics => {
  return items.reduce(
    (accumulator, item) => accumulator.concat(checker(item)),
    [] as Diagnostics,
  );
};
