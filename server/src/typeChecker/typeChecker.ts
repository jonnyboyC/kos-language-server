import {
  IExprVisitor,
  IStmtVisitor,
  IStmt,
  IExpr,
  ISuffixTerm,
  Atom,
  ISuffixTermParamVisitor,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Stmt from '../parser/stmt';
import * as Decl from '../parser/declare';
import {
  ITypeResultExpr,
  ITypeResolved,
  ITypeResultSuffix,
  ITypeResolvedSuffix,
  ITypeNode,
} from './types';
import { mockLogger, mockTracer } from '../utilities/logger';
import { Script } from '../entities/script';
import { empty } from '../utilities/typeGuards';
import {
  IArgumentType,
  IType,
  IVariadicType,
  Operator,
  ISuffixType,
  IFunctionType,
  CallType,
  TypeKind,
} from './types/types';
import { structureType } from './types/primitives/structure';
import { coerce } from './coerce';
import { iterator } from '../utilities/constants';
import { TokenType } from '../entities/tokentypes';
import { nodeType } from './types/node';
import { createFunctionType } from './types/ksType';
import { lexiconType } from './types/collections/lexicon';
import { zip } from '../utilities/arrayUtils';
import { isSubType, hasOperator, getSuffix, hasSuffix } from './typeUitlities';
import { voidType } from './types/primitives/void';
import { userListType } from './types/collections/userList';
import { booleanType } from './types/primitives/boolean';
import { stringType } from './types/primitives/string';
import { scalarType, integarType, doubleType } from './types/primitives/scalar';
import {
  suffixError,
  delegateCreation,
  arrayBracketIndexer,
  arrayIndexer,
} from './types/typeHelpers';
import { delegateType } from './types/primitives/delegate';
import { TypeNode } from './typeNode';
import { KsSymbolKind } from '../analysis/types';
import { rangeToString } from '../utilities/positionUtils';
import { listType } from './types/collections/list';
import { bodyTargetType } from './types/orbital/bodyTarget';
import { vesselTargetType } from './types/orbital/vesselTarget';
import { volumeType } from './types/io/volume';
import { volumeItemType } from './types/io/volumeItem';
import { partModuleFieldsType } from './types/parts/partModuleFields';
import { partType } from './types/parts/part';
import { pathType } from './types/io/path';
import { NodeBase } from '../parser/base';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { createDiagnostic } from '../utilities/diagnosticsUtils';

type Diagnostics = Diagnostic[];
type SuffixTermType = ISuffixType | IArgumentType;

/**
 * The type checker attempts to identify places where the rules of the type
 * system are broken.
 */
export class TypeChecker
  implements
    IStmtVisitor<Diagnostics>,
    IExprVisitor<ITypeResultExpr<IArgumentType>>,
    ISuffixTermParamVisitor<
      ITypeResultSuffix<IType>,
      ITypeResultSuffix<SuffixTermType>
    > {
  private readonly logger: ILogger;
  private readonly tracer: ITracer;
  private readonly script: Script;

  private readonly checkStmtBind = this.checkStmt.bind(this);

  constructor(
    script: Script,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
  ) {
    this.script = script;
    this.logger = logger;
    this.tracer = tracer;
  }

  /**
   * Check the source file for type errors
   */
  public check(): Diagnostics {
    // resolve the sequence of statements
    try {
      const splits = this.script.uri.split('/');
      const file = splits[splits.length - 1];

      this.logger.info(`Type Checking started for ${file}.`);

      const typeErrors = this.checkStmts(this.script.stmts);

      this.logger.info(`Type Checking finished for ${file}`);

      if (typeErrors.length) {
        this.logger.warn(`Type Checking encounted ${typeErrors.length} errors`);
      }

      return typeErrors;
    } catch (err) {
      this.logger.error(`Error occured in type checker ${err}`);
      this.tracer.log(err);
      return [];
    }
  }

  /**
   * Check a suffix for it's type
   * @param suffix suffix to check
   */
  public checkSuffix(
    suffix: Expr.Suffix,
  ): ITypeResultSuffix<IType, ITypeResolved> {
    try {
      const { suffixTerm, trailer } = suffix;
      const [firstTrailer, ...remainingTrailers] = suffixTerm.trailers;

      const atom = this.resolveAtom(suffixTerm.atom);
      let current: ITypeResultSuffix<IType> = atom;

      if (!empty(firstTrailer)) {
        // handle case were suffix is actually a function call
        if (firstTrailer instanceof SuffixTerm.Call) {
          current = this.resolveFunctionCall(firstTrailer, atom);
        } else {
          current = this.checkSuffixTerm(firstTrailer, atom);
        }

        for (const trailer of remainingTrailers) {
          current = this.checkSuffixTerm(trailer, current);
        }
      }

      const { type, resolved, errors } = current;
      if (type.kind === TypeKind.suffix || type.kind === TypeKind.function) {
        // const node = this.lastSuffixTermNode(suffixTerm);
        return this.errorsSuffixTerm(
          resolved,
          errors,
          createDiagnostic(suffixTerm.atom, 'TODO', DiagnosticSeverity.Hint),
        ) as ITypeResultSuffix<IType, ITypeResolved>;
      }

      if (empty(trailer)) {
        return current as ITypeResultSuffix<IType, ITypeResolved>;
      }

      const suffixTrailer = this.checkSuffixTerm(
        trailer,
        this.suffixTrailerResult(type, suffixTerm),
      );

      return this.resultSuffixTerm(
        suffixTrailer.type,
        { ...current.resolved, suffixTrailer: suffixTrailer.resolved },
        current.errors,
        suffixTrailer.errors,
      ) as ITypeResultSuffix<IType, ITypeResolved>;
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      this.tracer.log(err);
      return {
        type: structureType,
        resolved: {
          atomType: KsSymbolKind.variable,
          atom: new TypeNode(structureType, suffix.suffixTerm),
          termTrailers: [],
        },
        errors: [] as Diagnostics,
      };
    }
  }

  /**
   * check a collection of statements
   * @param stmts statements to check
   */
  private checkStmts(stmts: IStmt[]): Diagnostics {
    return accumulateErrors(stmts, this.checkStmtBind);
  }

  /**
   * Check an statement for errors
   * @param stmt statement to check
   */
  private checkStmt(stmt: IStmt): Diagnostics {
    return stmt.accept(this);
  }

  /**
   * Check an expression for errors
   * @param expr expression to check
   */
  private checkExpr(expr: IExpr): ITypeResultExpr<IArgumentType> {
    return expr.accept(this);
  }

  /**
   * Check a suffix term for errors
   * @param suffixTerm suffix term to check
   * @param current type resolved so far
   */
  private checkSuffixTerm(
    suffixTerm: ISuffixTerm,
    current: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<SuffixTermType> {
    return suffixTerm.acceptParam(this, current);
  }

  // ----------------------------- Declaration -----------------------------------------

  /**
   * Visit a variable declaration
   * @param decl variable declaration
   */
  visitDeclVariable(decl: Decl.Var): Diagnostics {
    const result = this.checkExpr(decl.value);
    const { tracker } = decl.identifier;

    if (!empty(tracker)) {
      tracker.declareType(result.type);
    }

    return result.errors;
  }

  /**
   * Vist a lock declaration
   * @param decl lock declaration
   */
  visitDeclLock(decl: Decl.Lock): Diagnostics {
    const result = this.checkExpr(decl.value);
    const { tracker } = decl.identifier;

    if (!empty(tracker)) {
      tracker.declareType(result.type);
    }

    return result.errors;
  }

  /**
   * Visit a function declaration
   * @param decl function declaration
   */
  visitDeclFunction(decl: Decl.Func): Diagnostics {
    const errors = this.checkStmt(decl.block);
    const { tracker } = decl.identifier;

    if (!empty(tracker)) {
      const { symbol } = tracker.declared;
      if (symbol.tag === KsSymbolKind.function) {
        const paramsTypes: IArgumentType[] = [];

        // TODO eventually we should tag ks parameter to the function type
        for (let i = 0; i < symbol.requiredParameters; i += 1) {
          paramsTypes.push(structureType);
        }
        for (let i = 0; i < symbol.optionalParameters; i += 1) {
          paramsTypes.push(structureType);
        }

        const returnType = symbol.returnValue ? structureType : voidType;

        const funcType = createFunctionType(
          tracker.declared.symbol.name.lookup,
          returnType,
          ...paramsTypes,
        );

        tracker.declareType(funcType);
      }
    }

    return errors;
  }

  /**
   * Visit a parameter declaration
   * @param decl parameter declaration
   */
  visitDeclParameter(decl: Decl.Param): Diagnostics {
    let errors: Diagnostics = [];

    // loop over normal parameters
    for (const required of decl.requiredParameters) {
      const { tracker } = required.identifier;

      if (!empty(tracker)) {
        tracker.declareType(structureType);
      }
    }

    // loop over defaulted parameters
    for (const optional of decl.optionalParameters) {
      const valueResult = this.checkExpr(optional.value);
      const { tracker } = optional.identifier;

      if (!empty(tracker)) {
        tracker.declareType(valueResult.type);
      }

      errors = errors.concat(valueResult.errors);
    }

    return errors;
  }

  // ----------------------------- Statements -----------------------------------------

  /**
   * Vist an invalid statement
   * @param stmt invalid statement
   */
  public visitStmtInvalid(stmt: Stmt.Invalid): Diagnostics {
    if (empty(stmt.partial)) {
      return [];
    }

    const errors = [];

    // check parsed partial nodes
    for (const node of Object.values(stmt.partial)) {
      if (node instanceof Stmt.Stmt) {
        errors.push(...this.checkStmt(node));
      }

      if (node instanceof Expr.Expr) {
        const result = this.checkExpr(node);
        errors.push(...result.errors);
      }
    }

    return errors;
  }

  /**
   * Vist a block statement
   * @param stmt statement block
   */
  public visitBlock(stmt: Stmt.Block): Diagnostics {
    return accumulateErrors(stmt.stmts, this.checkStmtBind);
  }

  /**
   * Visit an statement expression
   * @param stmt statement expression
   */
  public visitExpr(stmt: Stmt.ExprStmt): Diagnostics {
    const result = this.checkExpr(stmt.suffix);
    return result.errors;
  }

  /**
   * Visit an on off statement
   * @param stmt on / off statement
   */
  public visitOnOff(stmt: Stmt.OnOff): Diagnostics {
    const result = this.checkExpr(stmt.suffix);
    return result.errors;
  }

  /**
   * Visit a command statement
   * @param _ command statement
   */
  public visitCommand(_: Stmt.Command): Diagnostics {
    return [];
  }

  /**
   * Visit a command expression statement
   * @param stmt command expression statement
   */
  public visitCommandExpr(stmt: Stmt.CommandExpr): Diagnostics {
    const result = this.checkExpr(stmt.expr);
    const errors: Diagnostics = result.errors;

    switch (stmt.command.type) {
      // commands for adding and removing nodes
      case TokenType.add:
      case TokenType.remove:
        // expression must be a node type for node commands
        if (!coerce(result.type, nodeType)) {
          const command =
            stmt.command.type === TokenType.add ? 'add' : 'remove';

          errors.push(
            createDiagnostic(
              stmt.expr,
              `${command} expected a node.` +
                ' Node may not able to be  be coerced into node type',
              DiagnosticSeverity.Hint,
            ),
          );
        }
        break;
      // command to edit a file
      case TokenType.edit:
        if (!coerce(result.type, nodeType)) {
          errors.push(
            createDiagnostic(
              stmt.expr,
              'Path may not be coerced into string type',
              DiagnosticSeverity.Hint,
            ),
          );
        }
        break;
      default:
        throw new Error('Unexpected token type found in command expression');
    }

    return result.errors;
  }

  /**
   * Visit an unset statement
   * @param _ unset statement
   */
  public visitUnset(_: Stmt.Unset): Diagnostics {
    return [];
  }

  /**
   * Visit an unlock statement
   * @param _ unlock statement
   */
  public visitUnlock(_: Stmt.Unlock): Diagnostics {
    return [];
  }

  // visit set
  /**
   * Visit set statement
   * @param stmt set statement
   */
  public visitSet(stmt: Stmt.Set): Diagnostics {
    const exprResult = this.checkExpr(stmt.value);
    const errors = exprResult.errors;

    // check if suffix is settable
    if (!stmt.suffix.isSettable()) {
      return errors.concat(
        createDiagnostic(
          stmt.suffix,
          `Cannot set ${this.nodeError(stmt.suffix)} as it is a call`,
          DiagnosticSeverity.Hint,
        ),
      );
    }

    const { atom, trailers } = stmt.suffix.suffixTerm;

    // if a suffix trailer exists we are a full suffix
    if (!empty(stmt.suffix.trailer) || trailers.length > 0) {
      const suffixResult = this.checkExpr(stmt.suffix);
      const setErrors: Diagnostics = [];

      if (!coerce(exprResult.type, suffixResult.type)) {
        setErrors.push(
          createDiagnostic(
            stmt.suffix,
            `Cannot set suffix ${this.nodeError(stmt.suffix)}` +
              `of type ${suffixResult.type.name} to ${exprResult.type.name}`,
            DiagnosticSeverity.Hint,
          ),
        );
      }

      return errors.concat(suffixResult.errors, setErrors);
    }

    if (atom instanceof SuffixTerm.Identifier) {
      const { tracker } = atom.token;

      if (!empty(tracker)) {
        // update declare or set type
        if (tracker.declared.symbol.name === atom.token) {
          tracker.declareType(exprResult.type);
        } else {
          tracker.setType(atom.token, exprResult.type);
        }
      }
    } else {
      errors.push(
        createDiagnostic(
          stmt.suffix,
          `Cannot set ${stmt.suffix.toString()}, must be identifier, or suffix`,
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors;
  }

  // visit lazy global directive
  public visitLazyGlobal(_: Stmt.LazyGlobal): Diagnostics {
    return [];
  }

  // visit if statement
  public visitIf(stmt: Stmt.If): Diagnostics {
    const conditionResult = this.checkExpr(stmt.condition);
    const errors: Diagnostics = conditionResult.errors;

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(
        createDiagnostic(
          stmt.condition,
          'Condition may not able to be  be coerced into boolean type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return empty(stmt.elseStmt)
      ? errors.concat(this.checkStmt(stmt.body))
      : errors.concat(
          this.checkStmt(stmt.body),
          this.checkStmt(stmt.elseStmt),
        );
  }

  // visit else statement
  public visitElse(stmt: Stmt.Else): Diagnostics {
    return this.checkStmt(stmt.body);
  }

  // visit until statement
  public visitUntil(stmt: Stmt.Until): Diagnostics {
    const conditionResult = this.checkExpr(stmt.condition);
    const errors = conditionResult.errors;

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(
        createDiagnostic(
          stmt.condition,
          'Condition may not able to be coerced into boolean type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors.concat(this.checkStmt(stmt.body));
  }

  // visit from loop
  public visitFrom(stmt: Stmt.From): Diagnostics {
    let errors: Diagnostics = this.checkStmt(stmt.initializer);
    const conditionResult = this.checkExpr(stmt.condition);
    errors = errors.concat(conditionResult.errors);

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(
        createDiagnostic(
          stmt.condition,
          'Condition may not able to be coerced into boolean type',
          DiagnosticSeverity.Hint,
        ),
      );
    }
    return errors.concat(
      this.checkStmt(stmt.increment),
      this.checkStmt(stmt.body),
    );
  }

  // vist when statment
  public visitWhen(stmt: Stmt.When): Diagnostics {
    const conditionResult = this.checkExpr(stmt.condition);
    const errors = conditionResult.errors;

    if (!coerce(conditionResult.type, booleanType)) {
      errors.push(
        createDiagnostic(
          stmt.condition,
          'Condition may not able to be coerced into boolean type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors.concat(this.checkStmt(stmt.body));
  }

  // visit return
  public visitReturn(stmt: Stmt.Return): Diagnostics {
    const errors: Diagnostics = [];
    if (!empty(stmt.value)) {
      // TODO maybe update function type?
    }

    return errors;
  }

  // visit break
  public visitBreak(_: Stmt.Break): Diagnostics {
    return [];
  }

  // visit switch
  public visitSwitch(stmt: Stmt.Switch): Diagnostics {
    const result = this.checkExpr(stmt.target);
    let errors = result.errors;

    if (coerce(result.type, stringType)) {
      errors = errors.concat(
        createDiagnostic(
          stmt.target,
          'May not be a string identifer for volume',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors;
  }

  /**
   * Visit a for loop
   * @param stmt for loop statement
   */
  public visitFor(stmt: Stmt.For): Diagnostics {
    const result = this.checkExpr(stmt.collection);
    let errors: Diagnostics = [];

    const { type } = result;

    if (type.kind !== TypeKind.basic || !hasSuffix(type, iterator)) {
      errors = errors.concat(
        createDiagnostic(
          stmt.collection,
          'May not be a valid enumerable type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    // TODO may be able to detect if type is really pure and not mixed
    const { tracker } = stmt.element;

    if (!empty(tracker)) {
      const collectionIterator = getSuffix(type, iterator);

      if (!empty(collectionIterator)) {
        const value = getSuffix(collectionIterator.returns, 'value');

        tracker.setType(
          stmt.element,
          value && value.returns || structureType,
        );
      } else {
        tracker.setType(stmt.element, structureType);
      }
    }
    return errors.concat(this.checkStmt(stmt.body));
  }

  // visit on
  public visitOn(stmt: Stmt.On): Diagnostics {
    const result = this.checkExpr(stmt.suffix);
    let errors: Diagnostics = [];

    if (coerce(result.type, booleanType)) {
      errors = errors.concat(
        createDiagnostic(
          stmt.suffix,
          'Condition may not able to be coerced into boolean type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors.concat(this.checkStmt(stmt.body));
  }

  // visit toggle
  public visitToggle(stmt: Stmt.Toggle): Diagnostics {
    const result = this.checkExpr(stmt.suffix);
    return result.errors;
  }

  // visit wait
  public visitWait(stmt: Stmt.Wait): Diagnostics {
    const result = this.checkExpr(stmt.expr);
    let errors: Diagnostics = result.errors;

    if (empty(stmt.until)) {
      if (!coerce(result.type, scalarType)) {
        errors = errors.concat(
          createDiagnostic(
            stmt.expr,
            'Wait requires a scalar type. ' +
              'This may not able to be coerced into scalar type',
            DiagnosticSeverity.Hint,
          ),
        );
      }
    } else {
      if (!coerce(result.type, booleanType)) {
        errors = errors.concat(
          createDiagnostic(
            stmt.expr,
            'Wait requires a boolean type. ' +
              'This may not able to be coerced into boolean type',
            DiagnosticSeverity.Hint,
          ),
        );
      }
    }

    return errors;
  }

  // visit log
  public visitLog(stmt: Stmt.Log): Diagnostics {
    const exprResult = this.checkExpr(stmt.expr);
    const logResult = this.checkExpr(stmt.target);
    const errors: Diagnostics = exprResult.errors.concat(logResult.errors);

    if (!coerce(exprResult.type, stringType)) {
      errors.push(
        createDiagnostic(
          stmt.expr,
          'Can only log a string type. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!coerce(exprResult.type, stringType)) {
      errors.push(
        createDiagnostic(
          stmt.expr,
          'Can only log to a path. ',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors;
  }

  // visit copy
  public visitCopy(stmt: Stmt.Copy): Diagnostics {
    const sourceResult = this.checkExpr(stmt.target);
    const targetResult = this.checkExpr(stmt.destination);
    const errors: Diagnostics = sourceResult.errors.concat(targetResult.errors);

    if (!coerce(sourceResult.type, stringType)) {
      errors.push(
        createDiagnostic(
          stmt.target,
          'Can only copy from a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!coerce(sourceResult.type, stringType)) {
      errors.push(
        createDiagnostic(
          stmt.destination,
          'Can only copy to a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors;
  }

  // visit rename
  public visitRename(stmt: Stmt.Rename): Diagnostics {
    const targetResult = this.checkExpr(stmt.target);
    const alternativeResult = this.checkExpr(stmt.alternative);
    const errors: Diagnostics = targetResult.errors.concat(
      alternativeResult.errors,
    );

    if (!coerce(targetResult.type, stringType)) {
      errors.push(
        createDiagnostic(
          stmt.target,
          'Can only rename from a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!coerce(targetResult.type, stringType)) {
      errors.push(
        createDiagnostic(
          stmt.alternative,
          'Can only rename to a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors;
  }
  public visitDelete(stmt: Stmt.Delete): Diagnostics {
    const targetResult = this.checkExpr(stmt.target);
    const errors: Diagnostics = targetResult.errors;

    if (!coerce(targetResult.type, stringType)) {
      errors.push(
        createDiagnostic(
          stmt.target,
          'Can only delete from a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (empty(stmt.volume)) {
      return errors;
    }

    const volumeResult = this.checkExpr(stmt.volume);
    if (
      !coerce(targetResult.type, stringType) &&
      !coerce(targetResult.type, pathType)
    ) {
      errors.push(
        createDiagnostic(
          stmt.volume,
          'Can only rename to a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors.concat(volumeResult.errors);
  }
  public visitRun(_: Stmt.Run): Diagnostics {
    return [];
  }
  public visitRunPath(_: Stmt.RunPath): Diagnostics {
    return [];
  }
  public visitRunPathOnce(_: Stmt.RunOncePath): Diagnostics {
    return [];
  }
  public visitCompile(stmt: Stmt.Compile): Diagnostics {
    const targetResult = this.checkExpr(stmt.target);
    const errors: Diagnostics = targetResult.errors;

    if (!coerce(targetResult.type, stringType)) {
      errors.push(
        createDiagnostic(
          stmt.target,
          'Can only compile from a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (empty(stmt.destination)) {
      return errors;
    }

    const destinationResult = this.checkExpr(stmt.destination);
    if (!coerce(destinationResult.type, stringType)) {
      errors.push(
        createDiagnostic(
          stmt.destination,
          'Can only compile to a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors.concat(destinationResult.errors);
  }
  public visitList(stmt: Stmt.List): Diagnostics {
    const { target, collection } = stmt;
    if (empty(target) || empty(collection)) {
      return [];
    }

    let finalType: IArgumentType;

    const errors: Diagnostics = [];
    switch (collection.lookup) {
      case 'bodies':
        finalType = bodyTargetType;
        break;
      case 'targets':
        finalType = vesselTargetType;
        break;
      case 'resources':
      case 'parts':
      case 'engines':
      case 'sensors':
      case 'elements':
      case 'dockingports':
        finalType = partType;
        break;
      case 'files':
        finalType = volumeItemType;
        break;
      case 'fonts':
        finalType = stringType;
        break;
      case 'volumes':
        finalType = volumeType;
        break;
      case 'processors':
        finalType = partModuleFieldsType;
        break;
      default:
        finalType = structureType;
        errors.push(
          createDiagnostic(
            collection,
            'Not a valid list identifier',
            DiagnosticSeverity.Hint,
          ),
        );
    }

    const { tracker } = target;
    if (!empty(tracker)) {
      tracker.setType(target, listType.toConcreteType(finalType));
    }

    return errors;
  }

  // visit empty statement
  public visitEmpty(_: Stmt.Empty): Diagnostics {
    return [];
  }

  // vist print statement
  public visitPrint(stmt: Stmt.Print): Diagnostics {
    const result = this.checkExpr(stmt.expr);
    const errors = result.errors;

    if (!coerce(result.type, structureType)) {
      errors.push(
        createDiagnostic(
          stmt.expr,
          'Cannot print a function, can only print structures',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors;
  }

  // visit invalid expression
  public visitExprInvalid(_: Expr.Invalid): ITypeResultExpr<IArgumentType> {
    return { type: structureType, errors: [] };
  }

  // ----------------------------- Expressions -----------------------------------------

  public visitBinary(expr: Expr.Binary): ITypeResultExpr<IArgumentType> {
    const rightResult = this.checkExpr(expr.right);
    const leftResult = this.checkExpr(expr.left);

    switch (expr.operator.type) {
      case TokenType.minus:
        return this.checkOperator(
          expr,
          leftResult,
          rightResult,
          Operator.subtract,
        );
      case TokenType.multi:
        return this.checkOperator(
          expr,
          leftResult,
          rightResult,
          Operator.multiply,
        );
      case TokenType.div:
        return this.checkOperator(
          expr,
          leftResult,
          rightResult,
          Operator.divide,
        );
      case TokenType.plus:
        return this.checkOperator(expr, leftResult, rightResult, Operator.plus);
      case TokenType.less:
        return this.checkOperator(
          expr,
          leftResult,
          rightResult,
          Operator.lessThan,
        );
      case TokenType.lessEqual:
        return this.checkOperator(
          expr,
          leftResult,
          rightResult,
          Operator.lessThanEqual,
        );
      case TokenType.greater:
        return this.checkOperator(
          expr,
          leftResult,
          rightResult,
          Operator.greaterThan,
        );
      case TokenType.greaterEqual:
        return this.checkOperator(
          expr,
          leftResult,
          rightResult,
          Operator.greaterThanEqual,
        );
      case TokenType.and:
      case TokenType.or:
        const errors = leftResult.errors.concat(rightResult.errors);
        if (
          !isSubType(leftResult.type, booleanType) ||
          !isSubType(leftResult.type, booleanType)
        ) {
          errors.push(
            createDiagnostic(
              expr,
              '"and" and "or" require boolean types. May not be able to coerce one or other',
              DiagnosticSeverity.Hint,
            ),
          );
        }
        return { errors, type: booleanType };
      case TokenType.equal:
        return this.checkOperator(
          expr,
          leftResult,
          rightResult,
          Operator.equal,
        );
      case TokenType.notEqual:
        return this.checkOperator(
          expr,
          leftResult,
          rightResult,
          Operator.notEqual,
        );
    }

    throw new Error(
      `Unexpected token ${
        expr.operator.typeString
      } type encountered in binary expression`,
    );
  }

  public visitUnary(expr: Expr.Unary): ITypeResultExpr<IArgumentType> {
    const result = this.checkExpr(expr.factor);
    const errors: Diagnostics = result.errors;
    let finalType: Maybe<IArgumentType> = undefined;

    switch (expr.operator.type) {
      case TokenType.plus:
      case TokenType.minus:
        // TODO check if this is true
        if (!coerce(result.type, scalarType)) {
          errors.push(
            createDiagnostic(
              expr.factor,
              '+/- only valid for a scalar type. ' +
                'This may not able to be coerced into scalar type',
              DiagnosticSeverity.Hint,
            ),
          );
        }
        finalType = scalarType;
        break;
      case TokenType.not:
        if (!coerce(result.type, booleanType)) {
          errors.push(
            createDiagnostic(
              expr.factor,
              'Can only "not" a boolean type. ' +
                'This may not able to be coerced into string type',
              DiagnosticSeverity.Hint,
            ),
          );
        }
        finalType = booleanType;
        break;
      case TokenType.defined:
        finalType = booleanType;
        break;
      default:
        throw new Error(
          `Invalid Token ${expr.operator.typeString} for unary operator.`,
        );
    }

    return { errors, type: finalType };
  }
  public visitFactor(expr: Expr.Factor): ITypeResultExpr<IArgumentType> {
    const suffixResult = this.checkExpr(expr.suffix);
    const exponentResult = this.checkExpr(expr.exponent);
    const errors = suffixResult.errors.concat(exponentResult.errors);

    if (!coerce(suffixResult.type, scalarType)) {
      errors.push(
        createDiagnostic(
          expr.suffix,
          'Can only use scalars as base of power' +
            'This may not able to be coerced into scalar type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!coerce(exponentResult.type, scalarType)) {
      errors.push(
        createDiagnostic(
          expr.exponent,
          'Can only use scalars as exponent of power' +
            'This may not able to be coerced into scalar type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return { errors, type: scalarType };
  }

  public visitSuffix(expr: Expr.Suffix): ITypeResultExpr<IArgumentType> {
    const { suffixTerm, trailer } = expr;
    const [firstTrailer, ...remainingTrailers] = suffixTerm.trailers;

    const atom = this.resolveAtom(suffixTerm.atom);
    let current: ITypeResultSuffix<IType> = atom;

    if (!empty(firstTrailer)) {
      // handle case were suffix is actually a function call
      if (firstTrailer instanceof SuffixTerm.Call) {
        current = this.resolveFunctionCall(firstTrailer, atom);
      } else {
        current = this.checkSuffixTerm(firstTrailer, atom);
      }

      for (const trailer of remainingTrailers) {
        current = this.checkSuffixTerm(trailer, current);
      }
    }

    const { type, errors } = current;
    if (type.kind === TypeKind.suffix || type.kind === TypeKind.function) {
      throw new Error('Type shouldn');
    }

    if (empty(trailer)) {
      return this.resultExpr(type, errors);
    }

    current = this.checkSuffixTerm(trailer, current);

    if (current.type.kind === TypeKind.basic) {
      return this.resultExpr(current.type, current.errors);
    }

    return this.errorsExpr(
      errors,
      current.errors,
      createDiagnostic(trailer, 'TODO', DiagnosticSeverity.Hint),
    );
  }

  public visitLambda(_: Expr.Lambda): ITypeResultExpr<IArgumentType> {
    return this.resultExpr(delegateType);
  }

  // ----------------------------- Suffix -----------------------------------------

  private resolveAtom(
    atom: Atom,
  ): ITypeResultSuffix<IArgumentType | IFunctionType, ITypeResolved> {
    if (atom instanceof SuffixTerm.Literal) {
      return this.resolveLiteral(atom);
    }

    if (atom instanceof SuffixTerm.Identifier) {
      return this.resolveIdentifier(atom);
    }

    if (atom instanceof SuffixTerm.Grouping) {
      return this.resolveGrouping(atom);
    }

    throw new Error('Unknown atom type');
  }

  private resolveLiteral(
    literal: SuffixTerm.Literal,
  ): ITypeResultSuffix<IArgumentType, ITypeResolved> {
    switch (literal.token.type) {
      case TokenType.true:
      case TokenType.false:
        return this.resultAtom(booleanType, literal, KsSymbolKind.variable);
      case TokenType.integer:
        return this.resultAtom(integarType, literal, KsSymbolKind.variable);
      case TokenType.double:
        return this.resultAtom(doubleType, literal, KsSymbolKind.variable);
      case TokenType.string:
      case TokenType.fileIdentifier:
        return this.resultAtom(stringType, literal, KsSymbolKind.variable);
      default:
        throw new Error('Unknown literal type');
    }
  }

  private resolveIdentifier(
    identifer: SuffixTerm.Identifier,
  ): ITypeResultSuffix<IArgumentType | IFunctionType, ITypeResolved> {
    const { tracker } = identifer.token;
    const type = tracker && tracker.getType(identifer.token);

    return empty(type) || empty(tracker)
      ? this.errorsAtom(
          identifer,
          createDiagnostic(
            identifer,
            'Unable to lookup identifier type',
            DiagnosticSeverity.Hint,
          ),
        )
      : this.resultAtom(type, identifer, tracker.declared.symbol.tag);
  }

  private resolveGrouping(
    grouping: SuffixTerm.Grouping,
  ): ITypeResultSuffix<IArgumentType, ITypeResolved> {
    const result = this.checkExpr(grouping.expr);
    return this.resultAtom(
      result.type,
      grouping,
      KsSymbolKind.variable,
      result.errors,
    );
  }

  private resolveFunctionCall(
    call: SuffixTerm.Call,
    current: ITypeResultSuffix<IType, ITypeResolved>,
  ): ITypeResultSuffix<IArgumentType, ITypeResolved> {
    const { type, resolved, errors } = current;
    if (type.kind !== TypeKind.function) {
      return this.errorsAtom(
        call,
        createDiagnostic(
          call,
          `Type ${type.name} does not have a call signiture`,
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!Array.isArray(type.params)) {
      const callResult = this.resolveVaradicCall(
        type.params,
        { type, resolved, errors },
        call,
      );
      return {
        ...callResult,
        resolved: {
          ...callResult.resolved,
          atomType: KsSymbolKind.function,
        },
      };
    }

    // handle normal functions
    const callResult = this.resolveNormalCall(
      type.params,
      { type, resolved, errors },
      call,
    );
    return {
      ...callResult,
      resolved: {
        ...callResult.resolved,
        atomType: KsSymbolKind.function,
      },
    };
  }

  public visitSuffixTrailer(
    suffixTerm: SuffixTerm.SuffixTrailer,
    current: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<SuffixTermType> {
    // check suffix term and trailers
    const result = this.checkSuffixTerm(suffixTerm.suffixTerm, current);
    const { type, resolved, errors } = result;

    // if no trailer exist attempt to return
    if (empty(suffixTerm.trailer)) {
      if (type.kind === TypeKind.basic) {
        return { type, resolved, errors };
      }

      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        createDiagnostic(
          suffixTerm.suffixTerm,
          `suffix ${result.type.name} ` +
            `of type ${result.type.toTypeString()} ` +
            'does not have a call signiture',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    const trailer = this.checkSuffixTerm(
      suffixTerm.trailer,
      this.suffixTrailerResult(type, suffixTerm),
    );
    // const node = this.lastSuffixNode(suffixTerm);

    return this.resultSuffixTerm(
      trailer.type,
      { ...result.resolved, suffixTrailer: trailer.resolved },
      result.errors,
      trailer.errors,
    );
  }

  public visitSuffixTermInvalid(
    suffixTerm: SuffixTerm.Invalid,
    param: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<IArgumentType> {
    if (suffixTerm && param) {
      console.log('TODO');
    }

    throw new Error('Method not implemented.');
  }

  public visitSuffixTerm(
    suffixTerm: SuffixTerm.SuffixTerm,
    current: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<IArgumentType> {
    const atom = this.checkSuffixTerm(suffixTerm.atom, current);
    let result = atom;

    for (const trailer of suffixTerm.trailers) {
      result = this.checkSuffixTerm(trailer, result);
    }

    const { type, resolved, errors } = result;

    // if we only have some basic type return it
    if (type.kind === TypeKind.basic) {
      return { type, resolved, errors };
    }

    // if we end with a suffix type that doesn't require a call return it.
    if (type.callType !== CallType.call) {
      return { resolved, errors, type: type.returns };
    }

    // if we end with a suffix type which requires a call that's an error.
    return this.errorsSuffixTermTrailer(
      this.lastSuffixTermNode(suffixTerm),
      resolved,
      errors,
    );
  }

  /**
   * Visit a call expression and check for type errors
   * @param call the current call expresion
   * @param current current resolved suffix expression
   */
  public visitCall(
    call: SuffixTerm.Call,
    current: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;

    if (type.kind !== TypeKind.suffix) {
      // TEST we can apparently call a suffix with no argument fine.
      if (type.kind === TypeKind.basic && call.args.length === 0) {
        return this.resultSuffixTermTrailer(type, call, resolved);
      }

      return this.errorsSuffixTermTrailer(
        call,
        resolved,
        createDiagnostic(
          call,
          `type ${type.name} does not have call signiture`,
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!Array.isArray(type.params)) {
      return this.resolveVaradicCall(
        type.params,
        { type, resolved, errors },
        call,
      );
    }

    // handle normal functions
    return this.resolveNormalCall(
      type.params,
      { type, resolved, errors },
      call,
    );
  }

  /**
   * Resolve variadic call for type errors
   * @param params parameter types
   * @param current current resolved suffix expression
   * @param call current call expression
   */
  private resolveVaradicCall(
    params: IVariadicType,
    current: ITypeResultSuffix<ISuffixType | IFunctionType>,
    call: SuffixTerm.Call,
  ): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;

    for (const arg of call.args) {
      const result = this.checkExpr(arg);
      if (!coerce(result.type, params.type)) {
        errors.push(
          createDiagnostic(
            arg,
            `Function argument could not be coerced into ${params.type.name}`,
            DiagnosticSeverity.Hint,
          ),
        );
      }
    }

    return this.resultSuffixTermTrailer(type, call, resolved, errors);
  }

  /**
   * Check a normal call signiture for type errors
   * @param params the parameter types
   * @param current the current resolved suffix
   * @param call the call expression
   */
  private resolveNormalCall(
    params: IType[],
    current: ITypeResultSuffix<ISuffixType | IFunctionType>,
    call: SuffixTerm.Call,
  ): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;

    for (const [arg, param] of zip(call.args, params)) {
      const result = this.checkExpr(arg);
      if (!coerce(result.type, param)) {
        errors.push(
          createDiagnostic(
            arg,
            `Function argument could not be coerced into ${param.name}`,
            DiagnosticSeverity.Hint,
          ),
        );
      }
    }

    // TODO length difference
    return this.resultSuffixTermTrailer(type, call, resolved, errors);
  }

  /**
   * visit an array index suffix expression.
   * @param suffixTerm the current array index
   * @param current the current type
   */
  public visitArrayIndex(
    suffixTerm: SuffixTerm.ArrayIndex,
    current: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<IArgumentType> {
    const { type, errors, resolved } = current;

    // TODO confirm indexable types
    // Only lists are indexable with '#'
    if (!coerce(type, userListType)) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        createDiagnostic(
          suffixTerm,
          'indexing with # requires a list',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    switch (suffixTerm.indexer.type) {
      // If index is integer we're already in good shape
      case TokenType.integer:
        return this.resultSuffixTermTrailer(
          arrayIndexer,
          suffixTerm,
          resolved,
          errors,
        );

      // If index is identify check that it holds a integarType
      case TokenType.identifier:
        const { tracker } = suffixTerm.indexer;
        const type = tracker && tracker.getType(suffixTerm.indexer);

        if (empty(type) || !coerce(type, integarType)) {
          return this.errorsSuffixTermTrailer(
            suffixTerm,
            resolved,
            errors,
            createDiagnostic(
              suffixTerm.indexer,
              `${suffixTerm.indexer.lexeme} is not a scalar type. ` +
                'Can only use scalar to index with #',
              DiagnosticSeverity.Hint,
            ),
          );
        }

        return this.resultSuffixTermTrailer(
          arrayIndexer,
          suffixTerm,
          resolved,
          errors,
        );

      // All other cases are unallowed
      default:
        return this.errorsSuffixTermTrailer(
          suffixTerm,
          resolved,
          errors,
          createDiagnostic(
            suffixTerm.indexer,
            'Cannot index array with # other than with scalars or variables',
            DiagnosticSeverity.Hint,
          ),
        );
    }
  }

  /**
   * visit an array bracket suffix expression.
   * @param suffixTerm the current array bracket expression
   * @param current the current ytpe
   */
  public visitArrayBracket(
    suffixTerm: SuffixTerm.ArrayBracket,
    current: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;
    const indexResult = this.checkExpr(suffixTerm.index);

    // if we know the collection type is a list we need a scalar indexer
    if (coerce(type, userListType) && !coerce(indexResult.type, scalarType)) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        indexResult.errors,
        createDiagnostic(
          suffixTerm.index,
          'Can only use scalars as list index' +
            'This may not able to be coerced into scalar type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    // if we know the collection type is a lexicon we need a string indexer
    if (coerce(type, lexiconType) && !coerce(indexResult.type, stringType)) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        indexResult.errors,
        createDiagnostic(
          suffixTerm.index,
          'Can only use string as lexicon index' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    // if we know the collection type is a string we need a scalar indexer
    if (!coerce(type, stringType) && !coerce(indexResult.type, scalarType)) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        indexResult.errors,
        createDiagnostic(
          suffixTerm.index,
          'Can only use string or scalar as index' +
            'This may not able to be coerced into string or scalar type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return this.resultSuffixTermTrailer(
      arrayBracketIndexer,
      suffixTerm,
      resolved,
      errors,
    );
  }

  /**
   * visit the suffix term for delgates. This will return a new delgate type
   * @param suffixTerm the current delgate node
   * @param current the currently resolved type
   */
  public visitDelegate(
    suffixTerm: SuffixTerm.Delegate,
    current: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<IArgumentType> {
    const { type, resolved, errors } = current;
    if (type.kind !== TypeKind.function) {
      return this.errorsSuffixTermTrailer(
        suffixTerm,
        resolved,
        errors,
        createDiagnostic(
          suffixTerm,
          'Can only create delegate of functions',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return this.resultSuffixTermTrailer(
      delegateCreation,
      suffixTerm,
      resolved,
      errors,
    );
  }

  /**
   * visit the suffix term for literals. This should not occur
   * @param _ literal syntax node
   * @param __ current type
   */
  public visitLiteral(
    _: SuffixTerm.Literal,
    __: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<IArgumentType> {
    throw new Error('Literal should not appear outside of suffix atom');
  }

  /**
   * visit the suffix term for identifier.
   * @param suffixTerm identifier syntax node
   * @param current current type
   */
  public visitIdentifier(
    suffixTerm: SuffixTerm.Identifier,
    current: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<SuffixTermType> {
    const { type, resolved, errors } = current;
    const suffix = getSuffix(type, suffixTerm.token.lookup);

    // may need to pass sommething in about if we're in get set context
    if (empty(suffix)) {
      return this.errorsSuffixTerm(
        { ...resolved, node: new TypeNode(suffixError, suffixTerm) },
        errors,
        createDiagnostic(
          suffixTerm,
          `Could not find suffix ${suffixTerm.token.lookup} for type ${
            type.name
          }`,
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return this.resultSuffixTerm(
      suffix,
      { ...resolved, node: new TypeNode(suffix, suffixTerm) },
      errors,
    );
  }

  /**
   * visit the suffix term for grouping. grouping is invalid in this context
   * @param _ grouping syntax node
   * @param __ current type
   */
  public visitGrouping(
    _: SuffixTerm.Grouping,
    __: ITypeResultSuffix<IType>,
  ): ITypeResultSuffix<IArgumentType> {
    throw new Error('Grouping should not appear outside of suffix atom');
  }

  // ----------------------------- Helpers -----------------------------------------

  /**
   * Check if the current operator is valid and it's resulting type
   * @param expr the operator expresion
   * @param leftResult the left type
   * @param rightResult the right type
   * @param operator the operator to consider
   */
  private checkOperator(
    expr: IExpr,
    leftResult: ITypeResultExpr<IType>,
    rightResult: ITypeResultExpr<IType>,
    operator: Operator,
  ): ITypeResultExpr<IArgumentType> {
    const leftType = leftResult.type;
    const rightType = rightResult.type;
    const errors = leftResult.errors.concat(rightResult.errors);
    let calcType: Maybe<IArgumentType> = undefined;

    // TODO could be more efficient
    if (isSubType(leftType, scalarType) && isSubType(rightType, scalarType)) {
      calcType = scalarType;
    } else if (
      isSubType(leftType, stringType) ||
      isSubType(rightType, stringType)
    ) {
      calcType = stringType;
    } else if (
      isSubType(leftType, booleanType) ||
      isSubType(rightType, booleanType)
    ) {
      calcType = booleanType;
    } else {
      const leftOp = hasOperator(leftType, operator);
      const rightOp = hasOperator(rightType, operator);

      if (empty(leftOp) && empty(rightOp)) {
        return {
          type: structureType,
          errors: errors.concat(
            createDiagnostic(
              expr,
              `${leftType.name} nor ${rightType.name} have TODO operator`,
              DiagnosticSeverity.Hint,
            ),
          ),
        };
      }

      if (!empty(leftOp)) {
        return { errors, type: leftOp };
      }
      if (!empty(rightOp)) {
        return { errors, type: rightOp };
      }

      return { errors, type: structureType };
    }

    const returnType = calcType.operators.get(operator);
    if (empty(returnType)) {
      return {
        type: structureType,
        errors: errors.concat(
          createDiagnostic(
            expr,
            `${calcType.name} type does not have TODO operator`,
            DiagnosticSeverity.Hint,
          ),
        ),
      };
    }

    return { errors, type: returnType };
  }

  /**
   * Accumulate all type errors defaults to structure type
   * @param errors type errors
   */
  private errorsExpr(
    ...errors: (Diagnostic | Diagnostic[])[]
  ): ITypeResultExpr<IArgumentType> {
    return this.resultExpr(structureType, ...errors);
  }

  /**
   * Return the resultant type with any errors
   * @param type current type
   * @param errors accumulated errors
   */
  private resultExpr<T extends IType>(
    type: T,
    ...errors: (Diagnostic | Diagnostic[])[]
  ): ITypeResultExpr<T> {
    return {
      type,
      errors: ([] as Diagnostic[]).concat(...errors),
    };
  }

  /**
   * an error for a suffixterm trailer
   * @param resolved the current resolved type
   * @param errors the accumulated errors
   */
  private errorsSuffixTermTrailer(
    node: SuffixTerm.SuffixTermBase,
    resolved: ITypeResolvedSuffix,
    ...errors: (Diagnostic | Diagnostic[])[]
  ): ITypeResultSuffix<IArgumentType, ITypeResolvedSuffix> {
    return this.resultSuffixTermTrailer(suffixError, node, resolved, ...errors);
  }

  /**
   * result of a suffix term trailer
   * @param type the current type
   * @param resolved the type resolve so far
   * @param errors the accumlated type errors
   */
  private resultSuffixTermTrailer(
    type: IType,
    node: SuffixTerm.SuffixTermBase,
    resolved: ITypeResolvedSuffix,
    ...errors: (Diagnostic | Diagnostic[])[]
  ): ITypeResultSuffix<IArgumentType, ITypeResolvedSuffix> {
    const { atom: current, termTrailers, suffixTrailer } = resolved;
    let returns = structureType;
    if (type.kind === TypeKind.function || type.kind === TypeKind.suffix) {
      returns = type.returns;
    } else {
      returns = type;
    }

    return this.resultSuffixTerm(
      returns,
      {
        suffixTrailer,
        atom: current,
        termTrailers: [...termTrailers, new TypeNode(type, node)],
      },
      ...errors,
    );
  }

  /**
   * Return the suffix error type
   * @param resolved the currently resolved type
   * @param errors all accumulated errors
   */
  private errorsSuffixTerm<R extends ITypeResolvedSuffix>(
    resolved: R,
    ...errors: (Diagnostic | Diagnostic[])[]
  ): ITypeResultSuffix<ISuffixType, R> {
    return this.resultSuffixTerm(suffixError, resolved, ...errors);
  }

  /**
   * Return the type result of the suffix term
   * @param type resultant type
   * @param resolved resolved cummulative suffix type
   * @param errors errors encounted while type checking
   */
  private resultSuffixTerm<T extends IType, R extends ITypeResolvedSuffix>(
    type: T,
    resolved: R,
    ...errors: (Diagnostic | Diagnostic[])[]
  ): ITypeResultSuffix<T, R> {
    return {
      type,
      resolved,
      errors: ([] as Diagnostic[]).concat(...errors),
    };
  }

  /**
   * Return the atom error type
   * @param node suffix term node the error occured
   * @param errors errors encountered while checking this atom
   */
  private errorsAtom(
    node: SuffixTerm.SuffixTermBase,
    ...errors: (Diagnostic | Diagnostic[])[]
  ): ITypeResultSuffix<IArgumentType, ITypeResolved> {
    return this.resultAtom(
      structureType,
      node,
      KsSymbolKind.variable,
      ...errors,
    );
  }

  /**
   * Returns the result of an atom typecheck
   * @param type the current type of the atom
   * @param node node checked for this checking
   * @param atomType the symbol type of the atom
   * @param errors errors encountered during the checking
   */
  private resultAtom<T extends IType>(
    type: T,
    node: SuffixTerm.SuffixTermBase,
    atomType: KsSymbolKind,
    ...errors: (Diagnostic | Diagnostic[])[]
  ): ITypeResultSuffix<T, ITypeResolved> {
    return {
      type,
      errors: ([] as Diagnostic[]).concat(...errors),
      resolved: {
        atomType,
        atom: new TypeNode(type, node),
        termTrailers: [],
      },
    };
  }

  /**
   * New result for a new suffix trailer to fill in
   * @param type the type of the suffix expression so far
   * @param node the node the type was derived from
   */
  private suffixTrailerResult<T extends IType>(
    type: T,
    node: SuffixTerm.SuffixTermBase,
  ): ITypeResultSuffix<T, ITypeResolvedSuffix> {
    return {
      type,
      resolved: {
        atom: new TypeNode(type, node),
        termTrailers: [] as ITypeNode<IType>[],
      },
      errors: [],
    };
  }

  private lastSuffixTermNode(
    suffixTerm: SuffixTerm.SuffixTerm,
  ): SuffixTerm.SuffixTermBase {
    return suffixTerm.trailers.length > 0
      ? suffixTerm.trailers[suffixTerm.trailers.length - 1]
      : suffixTerm.atom;
  }

  /**
   * Convert node to string and relevant range
   * @param node node to create message for
   */
  private nodeError(node: NodeBase): string {
    return `${node.toString()} ${rangeToString(node)}`;
  }
}

const accumulateErrors = <T>(
  items: T[],
  checker: (item: T) => Diagnostics,
): Diagnostics => {
  const errors: Diagnostics = [];

  for (const item of items) {
    errors.push(...checker(item));
  }

  return errors;
};
