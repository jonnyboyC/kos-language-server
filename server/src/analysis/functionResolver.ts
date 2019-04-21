import {
  IInstVisitor,
  IExprVisitor,
  IInst,
  ScopeType,
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
import { KsParameter } from '../entities/parameters';
import { TokenType } from '../entities/tokentypes';
import { mockLogger, mockTracer } from '../utilities/logger';
import { SymbolState } from './types';
import { SymbolTableBuilder } from './symbolTableBuilder';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { createDiagnostic } from '../utilities/diagnosticsUtils';
import { sep } from 'path';

export type Diagnostics = Diagnostic[];

export class FuncResolver
  implements
    IExprVisitor<Diagnostics>,
    IInstVisitor<Diagnostics>,
    ISuffixTermVisitor<Diagnostics> {
  private script: IScript;
  private scopeBuilder: SymbolTableBuilder;
  private readonly logger: ILogger;
  private readonly tracer: ITracer;

  constructor(
    script: IScript,
    symbolTableBuilder: SymbolTableBuilder,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
  ) {
    this.script = script;
    this.scopeBuilder = symbolTableBuilder;
    this.logger = logger;
    this.tracer = tracer;
  }

  // resolve the sequence of instructions
  public resolve(): Diagnostics {
    try {
      const splits = this.script.uri.split(sep);
      const file = splits[splits.length - 1];

      this.logger.info(
        `Function Resolving started for ${file}.`,
      );

      this.scopeBuilder.rewindScope();
      this.scopeBuilder.beginScope(this.script);

      const resolveErrors = this.resolveInsts(this.script.insts);
      const scopeErrors = this.scopeBuilder.endScope();
      const allErrors = resolveErrors.concat(scopeErrors);

      this.logger.info(
        `Function Resolving finished for ${file}`
      );
      
      if (allErrors.length) {
        this.logger.warn(`Function Resolver encounted ${allErrors.length} errors`);
      }

      return resolveErrors.concat(scopeErrors);
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
  public visitDeclLock(_: Lock): Diagnostics {
    return [];
  }

  // check function declaration
  public visitDeclFunction(decl: Func): Diagnostics {
    const scopeToken = decl.scope && decl.scope.scope;

    let scopeType: ScopeType;

    // functions are default global at file scope and local everywhere else
    if (empty(scopeToken)) {
      scopeType = this.scopeBuilder.isFileScope()
        ? ScopeType.global
        : ScopeType.local;
    } else {
      switch (scopeToken.type) {
        case TokenType.local:
          scopeType = ScopeType.local;
          break;
        case TokenType.global:
          scopeType = ScopeType.global;
          break;
        default:
          throw new Error(
            'Unexpected scope token encountered. Expected local or global.',
          );
      }
    }

    let returnValue = false;
    const parameterDecls: Param[] = [];
    for (const inst of decl.block.insts) {
      // get parameters for this function
      if (inst instanceof Param) {
        parameterDecls.push(inst);
        continue;
      }

      // determine if return exists
      if (inst instanceof Inst.Return) {
        returnValue = true;
      }
    }
    const [parameters, errors] = this.buildParameters(parameterDecls);
    const declareErrors = this.scopeBuilder.declareFunction(
      scopeType,
      decl.identifier,
      parameters,
      returnValue,
    );
    const instErrors = this.resolveInst(decl.block);

    return empty(declareErrors)
      ? instErrors.concat(errors)
      : instErrors.concat(errors, declareErrors);
  }

  private buildParameters(decls: Param[]): [KsParameter[], Diagnostics] {
    const parameters: KsParameter[] = [];
    const errors: Diagnostics = [];
    let defaulted = false;

    for (const decl of decls) {
      for (const parameter of decl.parameters) {
        if (defaulted) {
          errors.push(
            createDiagnostic(
              parameter.identifier,
              'Normal parameters cannot occur after defaulted parameters',
              DiagnosticSeverity.Error,
            ),
          );
        }
        parameters.push(
          new KsParameter(parameter.identifier, false, SymbolState.declared),
        );
      }

      for (const parameter of decl.defaultParameters) {
        defaulted = true;
        parameters.push(
          new KsParameter(parameter.identifier, true, SymbolState.declared),
        );
      }
    }

    return [parameters, errors];
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
    this.scopeBuilder.beginScope(inst);
    const errors = this.resolveInsts(inst.insts);
    this.scopeBuilder.endScope();

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
    return this.resolveExpr(inst.suffix).concat(this.resolveInst(inst.inst));
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

  public visitAnonymousFunction(expr: Expr.AnonymousFunction): Diagnostics {
    return this.resolveInsts(expr.insts);
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
