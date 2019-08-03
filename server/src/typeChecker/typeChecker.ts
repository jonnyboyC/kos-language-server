import {
  IExprVisitor,
  IStmtVisitor,
  IStmt,
  IExpr,
  ISuffixTerm,
  ISuffixTermParamVisitor,
  Atom,
} from '../parser/types';
import * as SuffixTerm from '../parser/suffixTerm';
import * as Expr from '../parser/expr';
import * as Stmt from '../parser/stmt';
import * as Decl from '../parser/declare';
import { ITypeResultExpr, TypeKind, OperatorKind, IType } from './types';
import { mockLogger, mockTracer, logException } from '../utilities/logger';
import { Script } from '../entities/script';
import { empty } from '../utilities/typeGuards';
import { structureType } from './types/primitives/structure';
import { iterator } from '../utilities/constants';
import { TokenType } from '../entities/tokentypes';
import { nodeType } from './types/node';
import { createFunctionType } from './typeCreators';
import { lexiconType } from './types/collections/lexicon';
import { zip } from '../utilities/arrayUtils';
import { binaryOperatorMap, unaryOperatorMap } from './typeUtilities';
import { voidType } from './types/primitives/void';
import { booleanType } from './types/primitives/boolean';
import { stringType } from './types/primitives/string';
import { scalarType, integerType, doubleType } from './types/primitives/scalar';
import {
  suffixError,
  delegateCreation,
  arrayBracketIndexer,
  arrayIndexer,
  functionError,
} from './typeHelpers';
import { delegateType } from './types/primitives/delegate';
import { TypeNode } from './typeNode';
import { KsSymbolKind, TrackerKind, SymbolTracker } from '../analysis/types';
import { rangeToString } from '../utilities/positionUtils';
import { listType } from './types/collections/list';
import { bodyTargetType } from './types/orbital/bodyTarget';
import { vesselTargetType } from './types/orbital/vesselTarget';
import { volumeType } from './types/io/volume';
import { volumeItemType } from './types/io/volumeItem';
import { partType } from './types/parts/part';
import { pathType } from './types/io/path';
import { NodeBase } from '../parser/base';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { createDiagnostic } from '../utilities/diagnosticsUtils';
import { BasicTracker } from '../analysis/tracker';
import { SuffixTypeBuilder } from './suffixTypeNode';
import { engineType } from './types/parts/engine';
import { dockingPortType } from './types/parts/dockingPort';
import { vesselSensorsType } from './types/vessel/vesselSensors';
import { kosProcessorFieldsType } from './types/kosProcessorFields';
import { elementType } from './types/parts/element';
import { aggregateResourceType } from './types/parts/aggregateResource';
import { Operator } from './operator';
import { VariadicType } from './ksType';

type Diagnostics = Diagnostic[];

/**
 * The type checker attempts to identify places where the rules of the type
 * system are broken.
 */
export class TypeChecker
  implements
    IStmtVisitor<Diagnostics>,
    IExprVisitor<ITypeResultExpr<IType>>,
    ISuffixTermParamVisitor<SuffixTypeBuilder, Diagnostics> {
  /**
   * the logger to logging information
   */
  private readonly logger: ILogger;

  /**
   * The tracer for logging the current stack tracer
   */
  private readonly tracer: ITracer;

  /**
   * The script that is being type checked
   */
  private readonly script: Script;

  /**
   * The cached bound check statement
   */
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
        this.logger.warn(
          `Type Checking encountered ${typeErrors.length} errors`,
        );
      }

      return typeErrors;
    } catch (err) {
      this.logger.error('Error occurred in type checker');
      logException(this.logger, this.tracer, err, LogLevel.error);
      return [];
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
  private checkExpr(expr: IExpr): ITypeResultExpr<IType> {
    return expr.accept(this);
  }

  /**
   * Check a suffix term for errors
   * @param suffixTerm suffix term to check
   * @param builder type resolved so far
   */
  private checkSuffixTerm(
    suffixTerm: ISuffixTerm,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    return suffixTerm.acceptParam(this, builder);
  }

  // ----------------------------- Declaration -----------------------------------------

  /**
   * Visit a variable declaration
   * @param decl variable declaration
   */
  visitDeclVariable(decl: Decl.Var): Diagnostics {
    const result = this.checkExpr(decl.value);
    const { tracker } = decl.identifier;

    if (this.isBasicTracker(tracker)) {
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

    if (this.isBasicTracker(tracker)) {
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

    if (!empty(tracker) && tracker.kind === TrackerKind.basic) {
      const { symbol } = tracker.declared;
      if (symbol.tag === KsSymbolKind.function) {
        const paramsTypes: IType[] = [];

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

      if (this.isBasicTracker(tracker)) {
        tracker.declareType(structureType);
      }
    }

    // loop over defaulted parameters
    for (const optional of decl.optionalParameters) {
      const valueResult = this.checkExpr(optional.value);
      const { tracker } = optional.identifier;

      if (this.isBasicTracker(tracker)) {
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
        if (!nodeType.canCoerceFrom(result.type)) {
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
        if (!nodeType.canCoerceFrom(result.type)) {
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
    const suffixResult = this.checkExpr(stmt.suffix);
    errors.push(...suffixResult.errors);

    // check if suffix is settable
    if (!stmt.suffix.isSettable()) {
      errors.push(
        createDiagnostic(
          stmt.suffix,
          `Cannot set ${this.nodeError(stmt.suffix)} as it is a call`,
          DiagnosticSeverity.Hint,
        ),
      );

      return errors;
    }

    const { atom, trailers } = stmt.suffix.suffixTerm;

    // if a suffix trailer exists we are a full suffix
    if (!empty(stmt.suffix.trailer) || trailers.length > 0) {
      if (!suffixResult.type.canCoerceFrom(exprResult.type)) {
        errors.push(
          createDiagnostic(
            stmt.suffix,
            `Cannot set suffix ${this.nodeError(stmt.suffix)}` +
              `of type ${suffixResult.type.name} to ${exprResult.type.name}`,
            DiagnosticSeverity.Hint,
          ),
        );
      }

      return errors;
    }

    if (atom instanceof SuffixTerm.Identifier) {
      const { tracker } = atom.token;

      if (this.isBasicTracker(tracker)) {
        // update declare or set type
        if (tracker.declared.symbol.name === atom.token) {
          tracker.declareType(exprResult.type);
        } else {
          tracker.setType(atom.token, exprResult.type);
        }
      } else {
        errors.push(
          createDiagnostic(
            stmt.value,
            'TODO visit set, this should not occur',
            DiagnosticSeverity.Hint,
          ),
        );
      }
    } else {
      // was not found to be a valid target of setting
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

    if (!booleanType.canCoerceFrom(conditionResult.type)) {
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
      : errors.concat(this.checkStmt(stmt.body), this.checkStmt(stmt.elseStmt));
  }

  // visit else statement
  public visitElse(stmt: Stmt.Else): Diagnostics {
    return this.checkStmt(stmt.body);
  }

  // visit until statement
  public visitUntil(stmt: Stmt.Until): Diagnostics {
    const conditionResult = this.checkExpr(stmt.condition);
    const errors = conditionResult.errors;

    if (booleanType.canCoerceFrom(conditionResult.type)) {
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

    if (!booleanType.canCoerceFrom(conditionResult.type)) {
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

    if (!booleanType.canCoerceFrom(conditionResult.type)) {
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

    if (stringType.canCoerceFrom(result.type)) {
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

    if (type.kind !== TypeKind.basic || empty(type.getSuffix(iterator))) {
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

    if (this.isBasicTracker(tracker)) {
      const collectionIterator = type.getSuffix(iterator);

      if (!empty(collectionIterator)) {
        const value = collectionIterator.getSuffix('value');

        const setType = (value && value.getAssignmentType()) || structureType;
        tracker.setType(stmt.element, setType);
      } else {
        tracker.setType(stmt.element, structureType);
      }
    }
    return errors.concat(this.checkStmt(stmt.body));
  }

  /**
   * Visit on statement
   * @param stmt on statement
   */
  public visitOn(stmt: Stmt.On): Diagnostics {
    const result = this.checkExpr(stmt.suffix);
    const errors: Diagnostics = [];

    if (!booleanType.canCoerceFrom(result.type)) {
      errors.push(
        createDiagnostic(
          stmt.suffix,
          'Condition may not able to be coerced into boolean type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors.concat(this.checkStmt(stmt.body));
  }

  /**
   * Visit toggle statement
   * @param stmt toggle statement
   */
  public visitToggle(stmt: Stmt.Toggle): Diagnostics {
    const result = this.checkExpr(stmt.suffix);
    const errors: Diagnostics = result.errors;

    if (!booleanType.canCoerceFrom(result.type)) {
      // can only toggle boolean values
      errors.push(
        createDiagnostic(
          stmt.suffix,
          'Toggle requires a boolean type. ' +
            'This may not able to be coerced into boolean type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return result.errors;
  }

  /**
   * Visit wait statement
   * @param stmt wait statement
   */
  public visitWait(stmt: Stmt.Wait): Diagnostics {
    const result = this.checkExpr(stmt.expr);
    const errors: Diagnostics = result.errors;

    if (empty(stmt.until)) {
      // no until wait a set amount of time
      if (!scalarType.canCoerceFrom(result.type)) {
        errors.push(
          createDiagnostic(
            stmt.expr,
            'Wait requires a scalar type. ' +
              'This may not able to be coerced into scalar type',
            DiagnosticSeverity.Hint,
          ),
        );
      }
    } else {
      // wait until condition
      if (!booleanType.canCoerceFrom(result.type)) {
        errors.push(
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

  /**
   * Visit log statement
   * @param stmt log statement
   */
  public visitLog(stmt: Stmt.Log): Diagnostics {
    const exprResult = this.checkExpr(stmt.expr);
    const logResult = this.checkExpr(stmt.target);
    const errors: Diagnostics = exprResult.errors.concat(logResult.errors);

    if (!stringType.canCoerceFrom(exprResult.type)) {
      errors.push(
        createDiagnostic(
          stmt.expr,
          'Can only log a string type. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!stringType.canCoerceFrom(exprResult.type)) {
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

    if (!stringType.canCoerceFrom(sourceResult.type)) {
      errors.push(
        createDiagnostic(
          stmt.target,
          'Can only copy from a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!stringType.canCoerceFrom(sourceResult.type)) {
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

    if (!stringType.canCoerceFrom(targetResult.type)) {
      errors.push(
        createDiagnostic(
          stmt.target,
          'Can only rename from a string or bare path. ' +
            'This may not able to be coerced into string type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!stringType.canCoerceFrom(targetResult.type)) {
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

    if (!stringType.canCoerceFrom(targetResult.type)) {
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
      !stringType.canCoerceFrom(targetResult.type) &&
      !pathType.canCoerceFrom(targetResult.type)
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

    if (!stringType.canCoerceFrom(targetResult.type)) {
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
    if (!stringType.canCoerceFrom(destinationResult.type)) {
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

  /**
   * Visit list statement
   * @param stmt list statement
   */
  public visitList(stmt: Stmt.List): Diagnostics {
    const { target, collection } = stmt;
    if (empty(target) || empty(collection)) {
      return [];
    }

    let finalType: IType;

    const errors: Diagnostics = [];

    // determine the type that list returns
    switch (collection.lookup) {
      case 'bodies':
        finalType = bodyTargetType;
        break;
      case 'targets':
        finalType = vesselTargetType;
        break;
      case 'elements':
        finalType = elementType;
        break;
      case 'resources':
        finalType = listType.toConcreteType(aggregateResourceType);
        break;
      case 'parts':
        finalType = partType;
        break;
      case 'sensors':
        finalType = vesselSensorsType;
        break;
      case 'dockingports':
        finalType = dockingPortType;
        break;
      case 'engines':
        finalType = engineType;
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
        finalType = kosProcessorFieldsType;
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
    if (this.isBasicTracker(tracker)) {
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

    if (!structureType.canCoerceFrom(result.type)) {
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
  public visitExprInvalid(_: Expr.Invalid): ITypeResultExpr<IType> {
    return { type: structureType, errors: [] };
  }

  // ----------------------------- Expressions -----------------------------------------

  /**
   * Check the ternary expression TODO need union type
   * @param expr ternary expression
   */
  public visitTernary(expr: Expr.Ternary): ITypeResultExpr<IType> {
    const conditionResult = this.checkExpr(expr.condition);
    const trueResult = this.checkExpr(expr.trueBranch);
    const falseResult = this.checkExpr(expr.falseBranch);

    const errors: Diagnostics = conditionResult.errors;

    errors.push(...trueResult.errors, ...falseResult.errors);

    if (!booleanType.canCoerceFrom(conditionResult.type)) {
      errors.push(
        createDiagnostic(
          expr.condition,
          'condition must be able to be coerced into boolean',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return { errors, type: trueResult.type };
  }

  public visitBinary(expr: Expr.Binary): ITypeResultExpr<IType> {
    const rightResult = this.checkExpr(expr.right);
    const leftResult = this.checkExpr(expr.left);

    const operatorKind = binaryOperatorMap.get(expr.operator.type);
    if (!empty(operatorKind)) {
      switch (operatorKind) {
        case OperatorKind.and:
        case OperatorKind.or:
          return this.checkLogical(expr, leftResult, rightResult);
        default:
          return this.checkBinary(expr, leftResult, rightResult, operatorKind);
      }
    }

    throw new Error(
      `Unexpected token ${
        expr.operator.typeString
      } type encountered in binary expression`,
    );
  }

  public visitUnary(expr: Expr.Unary): ITypeResultExpr<IType> {
    const result = this.checkExpr(expr.factor);
    const errors = result.errors;

    switch (expr.operator.type) {
      case TokenType.defined:
        return {
          errors,
          type: booleanType,
        };

      case TokenType.not:
        if (!booleanType.canCoerceFrom(result.type)) {
          errors.push(
            createDiagnostic(
              expr.factor,
              'Can only apply not operator to booleans',
              DiagnosticSeverity.Hint,
            ),
          );
        }

        return {
          errors,
          type: booleanType,
        };

      case TokenType.minus:
      case TokenType.plus:
        const operatorKind = unaryOperatorMap.get(expr.operator.type);
        if (!empty(operatorKind)) {
          return this.checkUnary(expr, result, operatorKind);
        }
    }

    throw new Error(
      `Invalid Token ${expr.operator.typeString} for unary operator.`,
    );
  }
  public visitFactor(expr: Expr.Factor): ITypeResultExpr<IType> {
    const suffixResult = this.checkExpr(expr.suffix);
    const exponentResult = this.checkExpr(expr.exponent);
    const errors = suffixResult.errors.concat(exponentResult.errors);

    if (!scalarType.canCoerceFrom(suffixResult.type)) {
      errors.push(
        createDiagnostic(
          expr.suffix,
          'Can only use scalars as base of power' +
            'This may not able to be coerced into scalar type',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    if (!scalarType.canCoerceFrom(exponentResult.type)) {
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

  /**
   * Visit a suffix
   * @param expr suffix expression
   */
  public visitSuffix(expr: Expr.Suffix): ITypeResultExpr<IType> {
    const { suffixTerm, trailer } = expr;
    const [firstTrailer, ...remainingTrailers] = suffixTerm.trailers;

    const builder = new SuffixTypeBuilder();
    const errors = this.checkSuffixTerm(suffixTerm.atom, builder);

    if (!empty(firstTrailer)) {
      // handle case were suffix is actually a function call
      if (firstTrailer instanceof SuffixTerm.Call) {
        const tracker = this.atomTracker(suffixTerm.atom);
        errors.push(...this.visitFunctionCall(firstTrailer, tracker, builder));
      } else {
        errors.push(...this.checkSuffixTerm(firstTrailer, builder));
      }

      // handle remaining suffix term trailers
      for (const trailer of remainingTrailers) {
        errors.push(...this.checkSuffixTerm(trailer, builder));
      }
    }

    // if we have a trailer check that as well
    if (!empty(trailer)) {
      errors.push(...this.checkSuffixTerm(trailer, builder));
    }

    return this.resultExpr(this.builderResult(builder), errors);
  }

  public visitLambda(expr: Expr.Lambda): ITypeResultExpr<IType> {
    const errors = this.checkStmt(expr.block);
    return this.resultExpr(delegateType, errors);
  }

  // ----------------------------- Suffix -----------------------------------------

  public visitSuffixTrailer(
    suffixTerm: SuffixTerm.SuffixTrailer,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    // check suffix term and trailers
    const errors = this.checkSuffixTerm(suffixTerm.suffixTerm, builder);

    // if no trailer exist attempt to return
    if (!empty(suffixTerm.trailer)) {
      errors.push(...this.checkSuffixTerm(suffixTerm.trailer, builder));
    }

    return errors;
  }

  public visitSuffixTermInvalid(
    suffixTerm: SuffixTerm.Invalid,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    builder.nodes.push(new TypeNode(suffixError, suffixTerm));

    return [];
  }

  public visitSuffixTerm(
    suffixTerm: SuffixTerm.SuffixTerm,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    // check the atom
    const errors = this.checkSuffixTerm(suffixTerm.atom, builder);

    // add any errors from trailers
    for (const trailer of suffixTerm.trailers) {
      errors.push(...this.checkSuffixTerm(trailer, builder));
    }

    return errors;
  }

  /**
   * Visit a call expression and check for type errors
   * @param call the current call expression
   * @param builder current resolved suffix expression
   */
  public visitCall(
    call: SuffixTerm.Call,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    if (!builder.isTrailer()) {
      throw new Error('Builder must be a trailer to be in visitCall');
    }

    const type = builder.current();
    const errors: Diagnostics = [];

    if (empty(type.callSignature)) {
      builder.nodes.push(new TypeNode(suffixError, call));
      call.open.tracker = suffixError.getTracker();
      call.close.tracker = suffixError.getTracker();

      errors.push(
        createDiagnostic(
          call,
          `${type.name} has no call signature`,
          DiagnosticSeverity.Hint,
        ),
      );

      return errors;
    }

    builder.nodes.push(new TypeNode(type, call));
    call.open.tracker = type.getTracker();
    call.close.tracker = type.getTracker();

    const { params } = type.callSignature;

    // handle variadic
    if (params.length === 1 && params[0].kind === TypeKind.variadic) {
      return this.visitVariadicCall(params[0], call);
    }

    // handle normal functions
    return this.visitNormalCall(params, call);
  }

  /**
   * Visit a function call site
   * @param call call suffix term expression
   * @param builder suffix type builder
   */
  private visitFunctionCall(
    call: SuffixTerm.Call,
    tracker: Maybe<SymbolTracker>,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    const type = builder.current();
    const errors: Diagnostics = [];

    // check if previous identifier resolves to a function
    // TODO figure out function trackers
    if (empty(type.callSignature)) {
      builder.nodes.push(new TypeNode(functionError, call));
      call.open.tracker = functionError.getTracker();
      call.close.tracker = functionError.getTracker();

      errors.push(
        createDiagnostic(
          call,
          `Type ${type.name} does not have a call signature`,
          DiagnosticSeverity.Hint,
        ),
      );

      return errors;
    }

    builder.nodes.push(new TypeNode(type, call));
    call.open.tracker = tracker;
    call.close.tracker = tracker;

    const { params } = type.callSignature;

    // handle normal or varadic calls
    if (params.length === 1 && params[0].kind === TypeKind.variadic) {
      errors.push(...this.visitVariadicCall(params[0], call));
    } else {
      errors.push(...this.visitNormalCall(params, call));
    }

    return errors;
  }

  /**
   * Resolve variadic call for type errors
   * @param params parameter types
   * @param call current call expression
   */
  private visitVariadicCall(params: IType, call: SuffixTerm.Call): Diagnostics {
    const errors: Diagnostics = [];
    if (!(params instanceof VariadicType)) {
      throw new Error('Expected variadic type.');
    }

    for (const arg of call.args) {
      // determine type of each argument
      const result = this.checkExpr(arg);
      errors.push(...result.errors);

      // add diagnostic if argument cannot be matched to parameter type
      if (!params.base.canCoerceFrom(result.type)) {
        errors.push(
          createDiagnostic(
            arg,
            `Function argument could not be coerced into ${params.toTypeString()}`,
            DiagnosticSeverity.Hint,
          ),
        );
      }
    }

    return errors;
  }

  /**
   * Check a normal call signature for type errors
   * @param params the parameter types
   * @param call the call expression
   */
  private visitNormalCall(params: IType[], call: SuffixTerm.Call): Diagnostics {
    const errors: Diagnostics = [];

    for (const [arg, param] of zip(call.args, params)) {
      // determine type of each argument
      const result = this.checkExpr(arg);
      errors.push(...result.errors);

      // add diagnostic if argument cannot be matched to parameter type
      if (!param.canCoerceFrom(result.type)) {
        errors.push(
          createDiagnostic(
            arg,
            `Function argument could not be coerced into ${param.name}`,
            DiagnosticSeverity.Hint,
          ),
        );
      }
    }

    // check argument length
    if (call.args.length !== params.length) {
      errors.push(
        createDiagnostic(
          call.close,
          `Function expected ${params.length} parameters but was called with ${
            call.args.length
          } arguments`,
          DiagnosticSeverity.Hint,
        ),
      );
    }

    return errors;
  }

  /**
   * visit an array index suffix expression.
   * @param suffixTerm the current array index
   * @param builder the current type
   */
  public visitArrayIndex(
    suffixTerm: SuffixTerm.ArrayIndex,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    if (!builder.isTrailer()) {
      throw new Error("TODO shouldn't be able to get here visitArrayIndex");
    }

    const type = builder.current();
    const errors: Diagnostics = [];

    builder.nodes.push(new TypeNode(arrayIndexer, suffixTerm));

    // TODO confirm indexable types
    // Only lists are indexable with '#'
    if (!listType.canCoerceFrom(type)) {
      errors.push(
        createDiagnostic(
          suffixTerm,
          'indexing with # requires a list',
          DiagnosticSeverity.Hint,
        ),
      );

      return errors;
    }

    switch (suffixTerm.indexer.type) {
      // If index is integer we're already in good shape
      case TokenType.integer:
        return errors;

      // If index is identify check that it holds a integer
      case TokenType.identifier:
        const { tracker } = suffixTerm.indexer;

        if (this.isBasicTracker(tracker)) {
          const type = tracker.getType(suffixTerm.indexer);

          if (!empty(type) && integerType.canCoerceFrom(type)) {
            return errors;
          }
        }

        errors.push(
          createDiagnostic(
            suffixTerm.indexer,
            `${suffixTerm.indexer.lexeme} is not a scalar type. ` +
              'Can only use scalar to index with #',
            DiagnosticSeverity.Hint,
          ),
        );

        return errors;

      // All other cases are disallowed
      default:
        errors.push(
          createDiagnostic(
            suffixTerm.indexer,
            'Can only index an array with # scalars or variables',
            DiagnosticSeverity.Hint,
          ),
        );

        return errors;
    }
  }

  /**
   * visit an array bracket suffix expression.
   * @param suffixTerm the current array bracket expression
   * @param builder the suffix type builder
   */
  public visitArrayBracket(
    suffixTerm: SuffixTerm.ArrayBracket,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    if (!builder.isTrailer()) {
      throw new Error("TODO shouldn't be able to get here visitArrayBracket");
    }

    const indexResult = this.checkExpr(suffixTerm.index);
    const errors = indexResult.errors;
    const type = builder.current();

    let indexer: Maybe<IType> = undefined;

    // if we know the collection type is a list we need a scalar indexer
    if (listType.canCoerceFrom(type)) {
      indexer = arrayBracketIndexer(
        type,
        scalarType,
        type.typeArguments.get('T') || structureType,
      );
      builder.nodes.push(new TypeNode(indexer, suffixTerm));

      if (!scalarType.canCoerceFrom(indexResult.type)) {
        errors.push(
          createDiagnostic(
            suffixTerm.index,
            'Can only use scalars as list index' +
              'This may not able to be coerced into scalar type',
            DiagnosticSeverity.Hint,
          ),
        );
      }
    }

    // if we know the collection type is a lexicon we need a string indexer
    if (lexiconType.canCoerceFrom(type)) {
      indexer = arrayBracketIndexer(type, stringType, structureType);
      builder.nodes.push(new TypeNode(indexer, suffixTerm));

      if (!stringType.canCoerceFrom(indexResult.type)) {
        errors.push(
          createDiagnostic(
            suffixTerm.index,
            'Can only use a string as a lexicon index.' +
              'This may not able to be coerced into string type',
            DiagnosticSeverity.Hint,
          ),
        );
      }
    }

    // if we know the collection type is a string we need a scalar indexer
    if (stringType.canCoerceFrom(type)) {
      indexer = arrayBracketIndexer(type, scalarType, stringType);
      builder.nodes.push(new TypeNode(indexer, suffixTerm));

      if (!scalarType.canCoerceFrom(indexResult.type)) {
        errors.push(
          createDiagnostic(
            suffixTerm.index,
            'Can only use a scalar as a string index.' +
              'This may not able to be coerced into scalar type',
            DiagnosticSeverity.Hint,
          ),
        );
      }
    }

    // if couldn't coerce into one of our collection types
    // insert error node
    if (empty(indexer)) {
      builder.nodes.push(new TypeNode(suffixError, suffixTerm));

      errors.push(
        createDiagnostic(
          suffixTerm,
          'Can only index a list, lexicon or string',
          DiagnosticSeverity.Hint,
        ),
      );

      suffixTerm.open.tracker = suffixError.getTracker();
      suffixTerm.close.tracker = suffixError.getTracker();
    } else {
      suffixTerm.open.tracker = indexer.getTracker();
      suffixTerm.close.tracker = indexer.getTracker();
    }

    return errors;
  }

  /**
   * visit the suffix term for delgates. This will return a new delgate type
   * @param suffixTerm the current delgate node
   * @param builder the suffix type builder
   */
  public visitDelegate(
    suffixTerm: SuffixTerm.Delegate,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    if (!builder.isTrailer()) {
      throw new Error("TODO shouldn't be able to get here visitDelegate");
    }

    const type = builder.current();
    const errors: Diagnostics = [];

    if (type.kind !== TypeKind.function) {
      errors.push(
        createDiagnostic(
          suffixTerm,
          'Can only create delegate of functions',
          DiagnosticSeverity.Hint,
        ),
      );
    }

    builder.nodes.push(new TypeNode(delegateCreation, suffixTerm));
    suffixTerm.atSign.tracker = delegateCreation.getTracker();

    return errors;
  }

  /**
   * visit the suffix term for literals.
   * @param suffixTerm literal syntax node
   * @param builder the suffix type builder
   */
  public visitLiteral(
    suffixTerm: SuffixTerm.Literal,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    if (builder.isTrailer()) {
      throw new Error("TODO shouldn't be able to get here visitLiteral");
    }

    // if we're at the base push the new type node onto the builder
    switch (suffixTerm.token.type) {
      case TokenType.true:
      case TokenType.false:
        builder.nodes.push(new TypeNode(booleanType, suffixTerm));
        return [];
      case TokenType.integer:
        builder.nodes.push(new TypeNode(integerType, suffixTerm));
        return [];
      case TokenType.double:
        builder.nodes.push(new TypeNode(doubleType, suffixTerm));
        return [];
      case TokenType.string:
      case TokenType.fileIdentifier:
        builder.nodes.push(new TypeNode(stringType, suffixTerm));
        return [];
      default:
        throw new Error('TODO invalid literal token found visitLiteral');
    }
  }

  /**
   * visit the suffix term for identifier.
   * @param suffixTerm identifier syntax node
   * @param builder the suffix type builder
   */
  public visitIdentifier(
    suffixTerm: SuffixTerm.Identifier,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    // if we're a trailer check for suffixes
    if (builder.isTrailer()) {
      const type = builder.current();
      const suffix = this.builderResult(builder).getSuffix(
        suffixTerm.token.lookup,
      );

      // may need to pass something in about if we're in get set context
      if (!empty(suffix)) {
        // assign type tracker
        suffixTerm.token.tracker = suffix.getTracker();

        // push new node onto builder
        builder.nodes.push(new TypeNode(suffix, suffixTerm));
        return [];
      }

      // assign error suffix type
      suffixTerm.token.tracker = suffixError.getTracker();

      // add suffix error to builder
      builder.nodes.push(new TypeNode(suffixError, suffixTerm));

      // indicate suffix not found
      return [
        createDiagnostic(
          suffixTerm,
          `Unable to find suffix ${
            suffixTerm.token.lookup
          } on type ${type.toTypeString()}`,
          DiagnosticSeverity.Hint,
        ),
      ];
    }

    const { tracker } = suffixTerm.token;

    // make sure we have a basic tracker
    if (this.isBasicTracker(tracker)) {
      const type = tracker.getType(suffixTerm.toLocation(this.script.uri));

      // if type is found at this location add it to builder
      if (!empty(type)) {
        builder.nodes.push(new TypeNode(type, suffixTerm));
        return [];
      }

      // if we can't find the type here default to structure
      builder.nodes.push(new TypeNode(structureType, suffixTerm));
      return [
        createDiagnostic(
          suffixTerm,
          `Cannot determine type for ${suffixTerm.token.lexeme}.`,
          DiagnosticSeverity.Hint,
        ),
      ];
    }

    // in theory we should never get here
    builder.nodes.push(new TypeNode(structureType, suffixTerm));

    // no error as this is likely a resolver error
    return [];
  }

  /**
   * visit the suffix term for grouping.
   * @param suffixTerm grouping syntax node
   * @param builder the suffix type builder
   */
  public visitGrouping(
    suffixTerm: SuffixTerm.Grouping,
    builder: SuffixTypeBuilder,
  ): Diagnostics {
    if (builder.isTrailer()) {
      throw new Error("TODO shouldn't be able to get here visitGrouping");
    }

    const { type, errors } = this.checkExpr(suffixTerm.expr);

    // push result of grouping onto builder
    builder.nodes.push(new TypeNode(type, suffixTerm));
    return errors;
  }

  // ----------------------------- Helpers -----------------------------------------

  /**
   * Get the tracker from an atom
   * @param atom atom
   */
  private atomTracker(atom: Atom): Maybe<SymbolTracker> {
    if (atom instanceof SuffixTerm.Identifier) {
      return atom.token.tracker;
    }

    return undefined;
  }

  /**
   * Is this tracker a basic tracker
   * @param tracker tracker to inspect
   */
  private isBasicTracker(
    tracker: Maybe<SymbolTracker>,
  ): tracker is BasicTracker {
    return !empty(tracker) && tracker.kind === TrackerKind.basic;
  }

  /**
   * Check if unary operator is valid for this type
   * @param expr unary expression
   * @param subExpression the sub expression result
   * @param operatorKind the kind of operator
   */
  private checkUnary(
    expr: Expr.Unary,
    subExpression: ITypeResultExpr<IType>,
    operatorKind: OperatorKind,
  ): ITypeResultExpr<IType> {
    const subType = subExpression.type;
    const subOp = subType.getOperator(operatorKind);
    const errors = subExpression.errors;

    if (!empty(subOp) && subOp.isUnary()) {
      return { errors, type: subOp.returnType };
    }

    errors.push(this.operatorError(operatorKind, expr.factor, subType));
    return {
      errors,
      type: structureType,
    };
  }

  /**
   * Check if a logical operator is valid for these operands
   * @param expr underlying expression
   * @param leftResult the left operand result
   * @param rightResult the right operand result
   */
  private checkLogical(
    expr: Expr.Binary,
    leftResult: ITypeResultExpr<IType>,
    rightResult: ITypeResultExpr<IType>,
  ): ITypeResultExpr<IType> {
    const leftType = leftResult.type;
    const rightType = rightResult.type;
    const errors = leftResult.errors.concat(rightResult.errors);

    // check if left can be converted to a boolean
    if (!booleanType.canCoerceFrom(leftType)) {
      errors.push(
        createDiagnostic(
          expr.left,
          `${leftType.name} cannot be converted to a boolean`,
          DiagnosticSeverity.Hint,
        ),
      );
      return { errors, type: booleanType };
    }

    // check if right can be converted to a boolean
    if (!booleanType.canCoerceFrom(rightType)) {
      errors.push(
        createDiagnostic(
          expr.right,
          `${rightType.name} cannot be converted to a boolean`,
          DiagnosticSeverity.Hint,
        ),
      );
      return { errors, type: booleanType };
    }

    return { errors, type: booleanType };
  }

  /**
   * Check if the current operator is valid and it's resulting type
   * @param expr the operator expression
   * @param leftResult the left type
   * @param rightResult the right type
   * @param operator the operator to consider
   */
  private checkBinary(
    expr: Expr.Binary,
    leftResult: ITypeResultExpr<IType>,
    rightResult: ITypeResultExpr<IType>,
    operator: OperatorKind,
  ): ITypeResultExpr<IType> {
    const leftType = leftResult.type;
    const rightType = rightResult.type;
    const errors = leftResult.errors.concat(rightResult.errors);
    let calcType: Maybe<IType> = undefined;

    // TODO could be more efficient
    if (leftType.isSubtypeOf(scalarType) && rightType.isSubtypeOf(scalarType)) {
      calcType = scalarType;
    } else if (
      leftType.isSubtypeOf(stringType) ||
      rightType.isSubtypeOf(stringType)
    ) {
      calcType = stringType;
    } else if (
      leftType.isSubtypeOf(booleanType) ||
      rightType.isSubtypeOf(booleanType)
    ) {
      calcType = booleanType;
    } else {
      const leftOps = leftType.getOperator(operator, rightType);
      const rightOps = rightType.getOperator(operator, leftType);

      if (empty(leftOps) && empty(rightOps)) {
        errors.push(this.operatorError(operator, expr, leftType, rightType));

        return {
          errors,
          type: structureType,
        };
      }

      if (!empty(leftOps) && !leftOps.isUnary()) {
        return { errors, type: leftOps.returnType };
      }
      if (!empty(rightOps) && !rightOps.isUnary()) {
        return { errors, type: rightOps.returnType };
      }

      errors.push(this.operatorError(operator, expr, leftType, rightType));
      return { errors, type: structureType };
    }

    const calcOps = calcType.getOperators().get(operator);
    if (!empty(calcOps) && calcType.canCoerceFrom(leftType)) {
      const result = this.tryBinaryOperators(calcOps, rightType, errors);
      if (!empty(result)) {
        return result;
      }
    }

    errors.push(this.operatorError(operator, expr, leftType, rightType));
    return { errors, type: structureType };
  }

  /**
   * Report an error when an operator is not supported by the provided types
   * @param operatorKind operator kind
   * @param expr expression the error occurred in
   * @param leftType the left type
   * @param rightType the right type
   */
  private operatorError(
    operatorKind: OperatorKind,
    expr: IExpr,
    leftType: IType,
    rightType?: IType,
  ): Diagnostic {
    if (empty(rightType)) {
      return createDiagnostic(
        expr,
        `${leftType.name} does not support the ${
          OperatorKind[operatorKind]
        } operator`,
        DiagnosticSeverity.Hint,
      );
    }

    return createDiagnostic(
      expr,
      `${leftType.name} nor ${rightType.name} supports the ${
        OperatorKind[operatorKind]
      } operator between them`,
      DiagnosticSeverity.Hint,
    );
  }

  /**
   * Check if any of the available binary operators can work for the other operand
   * @param operators the available operators for a given operator type
   * @param otherType the type of the other operand
   * @param errors the current set of errors
   */
  private tryBinaryOperators(
    operators: Operator[],
    rightType: IType,
    errors: Diagnostics,
  ): Maybe<ITypeResultExpr<IType>> {
    for (const operator of operators) {
      if (operator.isUnary()) {
        continue;
      }

      const { otherOperand, returnType } = operator;
      if (!empty(otherOperand) && otherOperand.canCoerceFrom(rightType)) {
        return { errors, type: returnType };
      }
    }

    return undefined;
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
   * Get the current result of the suffix type buildcallSignatureer
   * @param builder suffix type builder
   */
  private builderResult(builder: SuffixTypeBuilder): IType {
    const current = builder.current();
    return current.getAssignmentType();
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
