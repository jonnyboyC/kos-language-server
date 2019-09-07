import { IExprVisitor, IStmtVisitor, IStmt, IExpr } from '../parser/types';
import { BasicBlock } from './basicBlock';
import * as Expr from '../parser/expr';
import * as Decl from '../parser/declare';
import * as Stmt from '../parser/stmt';
import { mockLogger, mockTracer, logException } from '../utilities/logger';
import { Script } from '../entities/script';
import { empty } from '../utilities/typeGuards';
import { BlockKind, Boundary, ReturnContext } from './types';
import { IStack } from '../analysis/types';
import { BranchJump } from './branchJump';
import { GenerateBlocks } from './generateBlocks';
import { FlowGraph } from './flowGraph';

export class ControlFlow
  implements
    IExprVisitor<(basicBlock: BasicBlock) => void>,
    IStmtVisitor<(basicBlock: BasicBlock) => Maybe<BasicBlock>> {
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
   * Loop context stack
   */
  private readonly loopContexts: IStack<Boundary>;

  /**
   * Function context stack
   */
  private readonly funcContexts: IStack<Boundary>;

  /**
   * Trigger context stack
   */
  private readonly triggerContexts: IStack<Boundary>;

  /**
   * Return context stack;
   */
  private readonly returnContext: IStack<ReturnContext>;

  /**
   * Boundaries of functions through this script
   */
  private readonly functionBoundaries: Boundary[];

  /**
   * Boundaries of triggers throughout this script
   */
  private readonly triggerBoundaries: Boundary[];

  /**
   * Map from each statement to it's basic block
   */
  private stmtBlocks: Map<IStmt, BasicBlock>;

  constructor(
    script: Script,
    logger: ILogger = mockLogger,
    tracer: ITracer = mockTracer,
  ) {
    this.script = script;
    this.logger = logger;
    this.tracer = tracer;

    this.loopContexts = [];
    this.funcContexts = [];
    this.triggerContexts = [];
    this.returnContext = [];

    this.functionBoundaries = [];
    this.triggerBoundaries = [];
    this.stmtBlocks = new Map();
  }

  /**
   * Generate a control flow diagram
   */
  public flow(): Maybe<FlowGraph> {
    const gen = new GenerateBlocks(this.script);
    this.stmtBlocks = gen.generate();

    // resolve the sequence of statements
    const entry = new BasicBlock(BlockKind.scriptEntry);
    const exit = new BasicBlock(BlockKind.scriptEntry);

    try {
      let block: Maybe<BasicBlock> = entry;
      for (const stmt of this.script.stmts) {
        block = this.stmtFlow(stmt, block);

        if (empty(block)) {
          throw new Error('Script body should not be empty');
        }
      }

      // last blocks jumps to script exit
      block.addJump(exit);

      // return flow graph
      return new FlowGraph(
        { entry, exit },
        this.funcContexts as Boundary[],
        this.triggerContexts as Boundary[],
        this.stmtBlocks,
      );
    } catch (err) {
      this.logger.error('Error occurred in control flow');
      logException(this.logger, this.tracer, err, LogLevel.error);
      return undefined;
    }
  }

  /**
   * Check the flow of this statement
   * @param stmt statement to check
   * @param prevBlock the previous basic block
   */
  private stmtFlow(stmt: IStmt, prevBlock: BasicBlock): Maybe<BasicBlock> {
    return stmt.accept(this, [prevBlock]);
  }

  /**
   * Check the flow of this expression
   * @param expr expression to check
   * @param prevBlock the previous basic block
   */
  private exprFlow(expr: IExpr, prevBlock: BasicBlock): void {
    return expr.accept(this, [prevBlock]);
  }

  /**
   * Visit a variable declaration
   * @param decl declare variable statement
   * @param prevBlock current block
   */
  public visitDeclVariable(
    decl: Decl.Var,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(decl);
    this.exprFlow(decl.value, block);
    prevBlock.addJump(block);

    return block;
  }

  /**
   * Visit a lock declaration
   * @param decl declare lock statement
   * @param prevBlock current block
   */
  public visitDeclLock(decl: Decl.Lock, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(decl);
    this.exprFlow(decl.value, block);
    prevBlock.addJump(block);

    return block;
  }

  /**
   * Visit a function declaration
   * @param decl declare function statement
   * @param prevBlock current block
   */
  public visitDeclFunction(
    decl: Decl.Func,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(decl);
    prevBlock.addJump(block);

    const entry = new BasicBlock(BlockKind.unknownEntry);
    const exit = new BasicBlock(BlockKind.unknownExit);
    this.functionBoundaries.push({ entry, exit });

    this.trackFunc(entry, exit, () => {
      const finalBlock = this.stmtFlow(decl.block, entry);

      // if final block is reachable add jump to exit
      // this represents a function without a return
      if (!empty(finalBlock)) {
        finalBlock.addJump(exit);
      }
    });

    return block;
  }

  /**
   * Visit a parameter declaration
   * @param decl declare parameter statement
   * @param prevBlock current block
   */
  public visitDeclParameter(
    decl: Decl.Param,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(decl);
    for (const param of decl.optionalParameters) {
      this.exprFlow(param.value, block);
    }

    prevBlock.addJump(block);
    return block;
  }

  /**
   * Visit an invalid statement
   * @param stmt the invalid statement
   * @param prevBlock current block
   */
  public visitStmtInvalid(
    stmt: Stmt.Invalid,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    return block;
  }

  /**
   * Visit a block statement
   * @param stmt the block statement
   * @param prevBlock current block
   */
  public visitBlock(
    stmt: Stmt.Block,
    [prevBlock]: [BasicBlock],
  ): Maybe<BasicBlock> {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    // indicate block itself was used
    let currentBlock: Maybe<BasicBlock> = block;

    // add each statement of the block
    for (const blockStmt of stmt.stmts) {
      if (empty(currentBlock)) {
        return undefined;
      }

      currentBlock = this.stmtFlow(blockStmt, currentBlock);
    }

    return currentBlock;
  }

  /**
   * Visit a expression statement
   * @param stmt the expression statement
   * @param prevBlock current block
   */
  public visitExpr(stmt: Stmt.ExprStmt, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);
    this.exprFlow(stmt.suffix, block);

    return block;
  }

  /**
   * Visit a on off statement
   * @param stmt the on off statement
   * @param prevBlock current block
   */
  public visitOnOff(stmt: Stmt.OnOff, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);
    this.exprFlow(stmt.suffix, block);

    return block;
  }

  /**
   * Visit a command statement
   * @param stmt the command statement
   * @param prevBlock current block
   */
  public visitCommand(
    stmt: Stmt.Command,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    return block;
  }

  /**
   * Visit the command expression statement
   * @param stmt the command expression statement
   * @param prevBlock current block
   */
  public visitCommandExpr(
    stmt: Stmt.CommandExpr,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);
    this.exprFlow(stmt.expr, block);

    return block;
  }

  /**
   * Visit the unset statement
   * @param stmt the unset statement
   * @param prevBlock current block
   */
  public visitUnset(stmt: Stmt.Unset, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    return block;
  }

  /**
   * Visit the unlock statement
   * @param stmt the unlock statement
   * @param prevBlock current block
   */
  public visitUnlock(stmt: Stmt.Unlock, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    return block;
  }

  /**
   * Visit the set statement
   * @param stmt the set statement
   * @param prevBlock current block
   */
  public visitSet(stmt: Stmt.Set, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);
    this.exprFlow(stmt.value, block);
    this.exprFlow(stmt.suffix, block);

    return block;
  }

  /**
   * Visit the lazy global
   * @param stmt the lazy global
   * @param prevBlock current block
   */
  public visitLazyGlobal(
    stmt: Stmt.LazyGlobal,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    return block;
  }

  /**
   * Visit the if statement
   * @param stmt the if statement
   * @param prevBlock current block
   */
  public visitIf(stmt: Stmt.If, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    const exitBlock = new BasicBlock(BlockKind.basic);

    // process the then block
    const thenEntry = new BasicBlock(BlockKind.basic);
    const thenExit = this.stmtFlow(stmt.body, thenEntry);

    // if we reach the end of the if add straight jump to exit
    if (!empty(thenExit)) {
      thenExit.addJump(exitBlock);
    }

    // generate the block jump
    let branchJump: BranchJump;

    if (!empty(stmt.elseStmt)) {
      // process the else block if it exists
      const elseEntry = new BasicBlock(BlockKind.basic);
      const elseExit = this.stmtFlow(stmt.elseStmt, elseEntry);

      // if we reach end of else add straight jump to exit
      if (!empty(elseExit)) {
        elseExit.addJump(exitBlock);
      }

      branchJump = new BranchJump(stmt.condition, thenEntry, elseEntry);
    } else {
      branchJump = new BranchJump(stmt.condition, thenEntry, exitBlock);
    }

    // add jump to branches
    block.addJump(branchJump);
    return exitBlock;
  }

  /**
   * Visit the else statement
   * @param stmt the else statement
   * @param prevBlock the current block
   */
  public visitElse(
    stmt: Stmt.Else,
    [prevBlock]: [BasicBlock],
  ): Maybe<BasicBlock> {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    return this.stmtFlow(stmt.body, block);
  }

  /**
   * Visit the until statement
   * @param stmt the until statement
   * @param prevBlock the current block
   */
  public visitUntil(stmt: Stmt.Until, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    const exitBlock = new BasicBlock(BlockKind.basic);

    return this.trackLoop(block, exitBlock, () => {
      // process the body block
      const bodyEntry = new BasicBlock(BlockKind.basic);
      const bodyExit = this.stmtFlow(stmt.body, bodyEntry);

      // generate the block jump
      const branchJump = new BranchJump(stmt.condition, bodyEntry, exitBlock);

      // body and block both have same jump
      if (!empty(bodyExit)) {
        bodyExit.addJump(branchJump);
      }
      block.addJump(branchJump);

      return exitBlock;
    });
  }

  /**
   * Visit the from statement
   * @param stmt the from statement
   * @param prevBlock current block
   */
  public visitFrom(stmt: Stmt.From, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    const exitBlock = new BasicBlock(BlockKind.basic);

    return this.trackLoop(block, exitBlock, () => {
      const initializerExit = this.stmtFlow(stmt.initializer, block);

      // process the body block
      const bodyEntry = new BasicBlock(BlockKind.basic);
      const bodyExit = this.stmtFlow(stmt.body, bodyEntry);

      // generate the block jump
      const branchJump = new BranchJump(stmt.condition, bodyEntry, exitBlock);

      if (!empty(bodyExit)) {
        const stepExit = this.stmtFlow(stmt.increment, bodyExit);

        if (!empty(stepExit)) {
          stepExit.addJump(branchJump);
        }
      }

      // body and block both have same jump
      if (!empty(initializerExit)) {
        initializerExit.addJump(branchJump);
      }

      return exitBlock;
    });
  }

  /**
   * Visit a when statement
   * @param stmt the when statement
   * @param prevBlock the current block
   */
  public visitWhen(stmt: Stmt.When, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    // trigger entry and exit blocks for unknown
    const entry = new BasicBlock(BlockKind.unknownEntry);
    const exit = new BasicBlock(BlockKind.unknownExit);

    this.triggerBoundaries.push({ entry, exit });

    this.trackTrigger(entry, exit, () => {
      // process the body block
      const bodyEntry = new BasicBlock(BlockKind.basic);
      const bodyExit = this.stmtFlow(stmt.body, bodyEntry);

      // generate the block jump, either jump over or entry body
      const branchJump = new BranchJump(stmt.condition, bodyEntry, exit);
      entry.addJump(branchJump);

      if (!empty(bodyExit)) {
        bodyExit.addJump(exit);
      }
    });

    // return original basic block
    return block;
  }

  /**
   * Visit a return statement
   * @param stmt the return statement
   * @param prevBlock the current block
   */
  public visitReturn(
    stmt: Stmt.Return,
    [prevBlock]: [BasicBlock],
  ): Maybe<BasicBlock> {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    // add expr if it exits
    if (!empty(stmt.value)) {
      this.exprFlow(stmt.value, block);
    }

    // if there is a return context have it jump to that
    const returnContext = this.peekReturnContext();
    if (!empty(returnContext)) {
      block.addJump(returnContext.exit);
      return undefined;
    }

    // other wise invalid and connect to next node
    return block;
  }

  /**
   * Visit a break statement
   * @param stmt a break statement
   * @param prevBlock the current block
   */
  public visitBreak(
    stmt: Stmt.Break,
    [prevBlock]: [BasicBlock],
  ): Maybe<BasicBlock> {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    const breakContext = this.peekBreakContext();
    if (!empty(breakContext)) {
      block.addJump(breakContext.exit);
      return undefined;
    }

    return block;
  }

  /**
   * Visit a switch statement
   * @param stmt the switch statement
   * @param prevBlock the current block
   */
  public visitSwitch(stmt: Stmt.Switch, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);
    this.exprFlow(stmt.target, block);

    return block;
  }

  /**
   * Visit a for statement
   * @param stmt the for statement
   * @param prevBlock the current block
   */
  public visitFor(stmt: Stmt.For, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    const exitBlock = new BasicBlock(BlockKind.basic);

    return this.trackLoop(block, exitBlock, () => {
      // process the body block
      const bodyEntry = new BasicBlock(BlockKind.basic);
      const bodyExit = this.stmtFlow(stmt.body, bodyEntry);

      // generate the block jump
      const branchJump = new BranchJump(stmt.collection, bodyEntry, exitBlock);

      // body and block both have same jump
      if (!empty(bodyExit)) {
        bodyExit.addJump(branchJump);
      }
      block.addJump(branchJump);

      return exitBlock;
    });
  }

  /**
   * Visit a on statement
   * @param stmt the on statement
   * @param prevBlock the current block
   */
  public visitOn(stmt: Stmt.On, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    // trigger entry and exit blocks for unknown
    const entry = new BasicBlock(BlockKind.unknownEntry);
    const exit = new BasicBlock(BlockKind.unknownExit);

    this.triggerBoundaries.push({ entry, exit });

    this.trackTrigger(entry, exit, () => {
      // process the body block
      const bodyEntry = new BasicBlock(BlockKind.basic);
      const bodyExit = this.stmtFlow(stmt.body, bodyEntry);

      // generate the block jump, either jump over or entry body
      const branchJump = new BranchJump(stmt.suffix, bodyEntry, exit);
      entry.addJump(branchJump);

      if (!empty(bodyExit)) {
        bodyExit.addJump(exit);
      }
    });

    // return original basic block
    return block;
  }

  /**
   * Visit a toggle statement
   * @param stmt the toggle statement
   * @param prevBlock the current block
   */
  public visitToggle(stmt: Stmt.Toggle, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);
    this.exprFlow(stmt.suffix, block);

    return block;
  }

  /**
   * Visit a wait statement
   * @param stmt the wait statement
   * @param prevBlock the current block
   */
  public visitWait(stmt: Stmt.Wait, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);
    this.exprFlow(stmt.expr, block);

    return block;
  }

  /**
   * Visit a log statement
   * @param stmt the log statement
   * @param prevBlock the current block
   */
  public visitLog(stmt: Stmt.Log, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);
    this.exprFlow(stmt.expr, block);
    this.exprFlow(stmt.target, block);

    return block;
  }

  /**
   * Visit a copy statement
   * @param stmt the copy statement
   * @param prevBlock the current block
   */
  public visitCopy(stmt: Stmt.Copy, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    this.exprFlow(stmt.target, block);
    this.exprFlow(stmt.destination, block);

    return block;
  }

  /**
   * Visit a rename statement
   * @param stmt the rename statement
   * @param prevBlock the current block
   */
  public visitRename(stmt: Stmt.Rename, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    this.exprFlow(stmt.target, block);
    this.exprFlow(stmt.alternative, block);

    return block;
  }

  /**
   * Visit a delete statement
   * @param stmt the delete statement
   * @param prevBlock the current block
   */
  public visitDelete(stmt: Stmt.Delete, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    this.exprFlow(stmt.target, block);

    if (!empty(stmt.volume)) {
      this.exprFlow(stmt.volume, block);
    }

    return block;
  }

  /**
   * Visit a run statement
   * @param stmt the run statement
   * @param prevBlock the current block
   */
  public visitRun(stmt: Stmt.Run, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    if (!empty(stmt.args)) {
      for (const arg of stmt.args) {
        this.exprFlow(arg, block);
      }
    }

    if (!empty(stmt.expr)) {
      this.exprFlow(stmt.expr, block);
    }

    return block;
  }

  /**
   * Visit a runPath statement
   * @param stmt the runPath statement
   * @param prevBlock the current block
   */
  public visitRunPath(
    stmt: Stmt.RunPath,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    this.exprFlow(stmt.expr, block);
    if (!empty(stmt.args)) {
      for (const arg of stmt.args) {
        this.exprFlow(arg, block);
      }
    }

    return block;
  }

  /**
   * Visit a runPathOnce statement
   * @param stmt the runPath statement
   * @param prevBlock the current block
   */
  public visitRunPathOnce(
    stmt: Stmt.RunOncePath,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    this.exprFlow(stmt.expr, block);
    if (!empty(stmt.args)) {
      for (const arg of stmt.args) {
        this.exprFlow(arg, block);
      }
    }

    return block;
  }

  /**
   * Visit a compile statement
   * @param stmt the compile statement
   * @param prevBlock the current block
   */
  public visitCompile(
    stmt: Stmt.Compile,
    [prevBlock]: [BasicBlock],
  ): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    this.exprFlow(stmt.target, block);
    if (!empty(stmt.destination)) {
      this.exprFlow(stmt.destination, block);
    }

    return block;
  }

  /**
   * Visit a list statement
   * @param stmt the list statement
   * @param prevBlock the current block
   */
  public visitList(stmt: Stmt.List, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    return block;
  }

  /**
   * Visit a empty statement
   * @param stmt the empty statement
   * @param prevBlock the current block
   */
  public visitEmpty(stmt: Stmt.Empty, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);

    return block;
  }

  /**
   * Visit a print statement
   * @param stmt the print statement
   * @param prevBlock the current block
   */
  public visitPrint(stmt: Stmt.Print, [prevBlock]: [BasicBlock]): BasicBlock {
    const block = this.getBlock(stmt);
    prevBlock.addJump(block);
    this.exprFlow(stmt.expr, block);

    return block;
  }

  /**
   * Visit a invalid expression
   * @param expr the invalid expression
   * @param subBlock the current subBlock
   */
  public visitExprInvalid(expr: Expr.Invalid, [block]: [BasicBlock]): void {
    block.exprs.push(expr);
  }

  /**
   * Visit a ternary expression
   * @param expr the ternary expression
   * @param subBlock the current subBlock
   */
  public visitTernary(expr: Expr.Ternary, [block]: [BasicBlock]): void {
    this.exprFlow(expr.condition, block);
    this.exprFlow(expr.trueExpr, block);
    this.exprFlow(expr.falseExpr, block);
  }

  /**
   * Visit a binary expression
   * @param expr the binary expression
   * @param subBlock the current subBlock
   */
  public visitBinary(expr: Expr.Binary, [block]: [BasicBlock]): void {
    this.exprFlow(expr.left, block);
    this.exprFlow(expr.right, block);
  }

  /**
   * Visit a unary expression
   * @param expr the unary expression
   * @param subBlock the current subBlock
   */
  public visitUnary(expr: Expr.Unary, [block]: [BasicBlock]): void {
    this.exprFlow(expr.factor, block);
  }

  /**
   * Visit a factor expression
   * @param expr the factor expression
   * @param subBlock the current subBlock
   */
  public visitFactor(expr: Expr.Factor, [block]: [BasicBlock]): void {
    this.exprFlow(expr.suffix, block);
    this.exprFlow(expr.exponent, block);
  }

  /**
   * Visit a factor expression
   * @param expr the factor expression
   * @param subBlock the current subBlock
   */
  public visitSuffix(expr: Expr.Suffix, [block]: [BasicBlock]): void {
    block.exprs.push(expr);
  }

  /**
   * Visit a lambda expression
   * @param expr the lambda expression
   * @param subBlock the current subBlock
   */
  public visitLambda(expr: Expr.Lambda, [block]: [BasicBlock]): void {
    block.exprs.push(expr);

    const entry = new BasicBlock(BlockKind.unknownEntry);
    const exit = new BasicBlock(BlockKind.unknownExit);
    this.functionBoundaries.push({ entry, exit });

    this.trackFunc(entry, exit, () => {
      const finalBlock = this.stmtFlow(expr.block, entry);

      // if final block is reachable add jump to exit
      if (!empty(finalBlock)) {
        finalBlock.addJump(exit);
      }
    });
  }

  /**
   * Get a basic block for this statement
   * @param stmt statement to get a basic block
   */
  private getBlock(stmt: IStmt): BasicBlock {
    const block = this.stmtBlocks.get(stmt);
    if (empty(block)) {
      throw new Error('Unable to find basic block');
    }

    return block;
  }

  /**
   * Track a function context
   * @param entry what is the entry block
   * @param exit what is the exit block
   * @param track the function to perform the basic block manipulation
   */
  private trackFunc<T>(entry: BasicBlock, exit: BasicBlock, track: () => T): T {
    this.pushFuncContext({ entry, exit });
    const block = track();
    this.popFuncContext();
    return block;
  }

  /**
   * Track a loop context
   * @param entry what is the entry block
   * @param exit what is the exit block
   * @param track the loop to perform the basic block manipulation
   */
  private trackLoop(
    entry: BasicBlock,
    exit: BasicBlock,
    track: () => BasicBlock,
  ) {
    this.pushLoopContext({ entry, exit });
    const block = track();
    this.popLoopContext();
    return block;
  }

  /**
   * Track a trigger context
   * @param entry what is the entry block
   * @param exit what is the exit block
   * @param track the trigger to perform the basic block manipulation
   */
  private trackTrigger<T>(
    entry: BasicBlock,
    exit: BasicBlock,
    track: () => T,
  ): T {
    this.pushTriggerContext({ entry, exit });
    const block = track();
    this.popTriggerContext();
    return block;
  }

  /**
   * Push a new function boundary onto the stack
   * @param boundary function boundary
   */
  private pushFuncContext(boundary: Boundary): void {
    this.funcContexts.push(boundary);
    this.returnContext.push(ReturnContext.function);
  }

  /**
   * Pop a function boundary from the stack
   */
  private popFuncContext(): void {
    this.funcContexts.pop();
    this.checkReturnContext(ReturnContext.function);
  }

  /**
   * Push a trigger boundary onto the stack
   * @param boundary trigger boundary
   */
  private pushTriggerContext(boundary: Boundary): void {
    this.triggerContexts.push(boundary);
    this.returnContext.push(ReturnContext.trigger);
  }

  /**
   * Pop a trigger boundary from the stack
   */
  private popTriggerContext(): void {
    this.triggerContexts.pop();
    this.checkReturnContext(ReturnContext.trigger);
  }

  /**
   * Push a loop boundary onto the stack
   * @param boundary loop boundary
   */
  private pushLoopContext(boundary: Boundary): void {
    this.loopContexts.push(boundary);
  }

  /**
   * Pop a loop boundary from the stack
   */
  private popLoopContext(): void {
    this.loopContexts.pop();
  }

  /**
   * Peek the current return context from the stack
   */
  private peekReturnContext(): Maybe<Boundary> {
    return this.returnContext[this.returnContext.length - 1] ===
      ReturnContext.function
      ? this.funcContexts[this.funcContexts.length - 1]
      : this.triggerContexts[this.triggerContexts.length - 1];
  }

  /**
   * Peek the current break context from the stack
   */
  private peekBreakContext(): Maybe<Boundary> {
    return this.loopContexts[this.loopContexts.length - 1];
  }

  /**
   * Check that the return context is correct
   * @param expected the expected return context
   */
  private checkReturnContext(expected: ReturnContext): void {
    const context = this.returnContext.pop();
    if (context !== expected) {
      throw new Error('Error in control flow unexpected return context');
    }
  }
}
