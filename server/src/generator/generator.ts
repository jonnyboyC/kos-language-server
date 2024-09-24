// import * as Decl from '../parser/declare';
import * as Expr from '../parser/models/expr';
import * as Stmt from '../parser/models/stmt';
import * as SuffixTerm from '../parser/models/suffixTerm';
import { getRandomInt } from '../utilities/randomUtils';
import { mockLogger, mockTracer } from '../models/logger';
import {
  IExprClass, IExprClassVisitor,
  IGrammarUnion, GrammarNode, IStmtClass,
  IGrammarOptional, IGrammarRepeat, Distribution, ISuffixTermClass,
} from '../parser/types';
import { TokenType } from '../models/tokentypes';
import { keywords } from '../utilities/constants';
const jStat = require('jstat').jStat;

const ALPHA_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_NUMERIC_CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const ASCII_LOW = 35;
const ASCII_HIGH = 126;

const ID_GAMMA_SHAPE = 12;
const ID_GAMMA_SCALE = 0.75;

const STRING_GAMMA_SHAPE = 18;
const STRING_GAMMA_SCALE = 0.75;

const DOUBLE_LOGNORM_MEAN = 0;
const DOUBLE_LOGNORM_SIGMA = 5;

export class Generator implements IExprClassVisitor<string> {
  constructor(
    public readonly mutation: IMutation,
    public readonly logger: ILogger = mockLogger,
    public readonly tracer: ITracer = mockTracer) {
  }

  public generateExpr(exprType?: IExprClass): string {
    try {
      const exprClass = exprType || this.randomEntity(Expr.validExprTypes);
      return this.genExpr(exprClass);
    } catch (err) {
      this.logger.error(`Error occured in resolver ${err}`);
      if (typeof err === 'string') {
        this.tracer.log(err);
      }

      return '';
    }
  }

  // resolve for an expression
  private genExpr(exprClass: IExprClass): string {
    return exprClass.classAccept(this);
  }

  private draw(dist: Distribution): number {
    switch (dist.tag) {
      case 'constant':
        return dist.value;
      case 'exp':
        const expDraw = jStat.exponential.sample(dist.rate) as number;
        return expDraw > 0 ? expDraw : 0;
      case 'gamma':
        const grammDraw = jStat.gamma.sample(dist.shape, dist.scale) as number;
        return grammDraw > 0 ? grammDraw : 0;
      case 'normal':
        const normalDraw = jStat.normal.sample(dist.mean, dist.std) as number;
        return normalDraw > 0 ? normalDraw : 0;
      default:
        throw new Error('Unsupported distribution');
    }
  }

  // given a list of expression constructors pick one
  private randomEntity<T>(entities: [T, Distribution][]): T {
    const draws = entities.map(([_, dist]) => this.draw(dist));

    const cummulative = [draws[0]];
    for (const draw of draws.slice(1)) {
      cummulative.push(cummulative[cummulative.length - 1] + draw);
    }
    const indexDraw = Math.random() * cummulative[cummulative.length - 1];

    for (let i = 0; i < cummulative.length; i += 1) {
      if (indexDraw <= cummulative[i]) {
        return entities[i][0];
      }
    }

    throw new Error('');
  }

  visitExprInvalid(exprClass: IExprClass<Expr.Invalid>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitTernary(exprClass: IExprClass<Expr.Ternary>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitBinary(exprClass: IExprClass<Expr.Binary>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitUnary(exprClass: IExprClass<Expr.Unary>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitFactor(exprClass: IExprClass<Expr.Factor>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitSuffix(exprClass: IExprClass<Expr.Suffix>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitAnonymousFunction(exprClass: IExprClass<Expr.Lambda>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitSuffixTerm(exprClass: ISuffixTermClass<SuffixTerm.SuffixTerm>): string {
    throw this.generateGrammarNodes(exprClass.grammar);
  }
  visitCall(exprClass: ISuffixTermClass<SuffixTerm.Call>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitArrayIndex(exprClass: ISuffixTermClass<SuffixTerm.HashIndex>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitArrayBracket(exprClass: ISuffixTermClass<SuffixTerm.BracketIndex>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitDelegate(exprClass: ISuffixTermClass<SuffixTerm.Delegate>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitLiteral(exprClass: ISuffixTermClass<SuffixTerm.Literal>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitVariable(exprClass: ISuffixTermClass<SuffixTerm.Identifier>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }
  visitGrouping(exprClass: ISuffixTermClass<SuffixTerm.Grouping>): string {
    return this.generateGrammarNodes(exprClass.grammar);
  }

  private generateGrammarNode(node: GrammarNode): string {
    if (isNode(node)) {
      if (node instanceof Object) {
        if (node.prototype instanceof Expr.Expr) {
          return this.genExpr(node as IExprClass);
        }

        if (node.prototype instanceof Stmt.Stmt) {
          throw new Error();
        }

        throw new Error();
      }

      return this.generateToken(node);
    }

    switch (node.tag) {
      case 'optional':
        return this.generateOptional(node);
      case 'union':
        return this.generateUnion(node);
      case 'repeat':
        return this.generateRepeat(node);
    }
  }

  private generateUnion(union: IGrammarUnion) {
    const node = this.randomEntity(union.node);
    return this.generateGrammarNode(node);
  }

  private generateOptional(optional: IGrammarOptional): string {
    const threshold = this.draw(optional.dist);
    const value = Math.random();

    if (value > threshold) {
      return this.generateGrammarNodes(optional.nodes);
    }

    return '';
  }

  private generateRepeat(repeat: IGrammarRepeat): string {
    const draw = Math.floor(this.draw(repeat.dist));

    const results: string[] = [];

    for (let i = 0; i < draw; i += 1) {
      results.push(this.generateGrammarNodes(repeat.nodes));
    }

    return results.join('');
  }

  private generateGrammarNodes(nodes: GrammarNode[]): string {
    return nodes.map(node => this.generateGrammarNode(node)).join('');
  }

  private generateInteger(): string {
    return getRandomInt(1e6).toFixed(0);
  }

  private generateDouble(): string {
    const number = jStat.lognormal.sample(DOUBLE_LOGNORM_MEAN, DOUBLE_LOGNORM_SIGMA) as number;
    let numberStr = number.toExponential(getRandomInt(20));

    const removeSign = Math.random();
    if (removeSign < 0.1) {
      numberStr = numberStr.replace(/(\+|\-)/gi, '');
    }

    return numberStr;
  }

  private generateRandomString(length: number): string {
    let rngString = '';

    for (let i = 0; i < length; i += 1) {
      const rngChar = Math.floor((Math.random() * (ASCII_HIGH - ASCII_LOW)) + ASCII_LOW);
      rngString += String.fromCharCode(rngChar);
    }
    return rngString;
  }

  private generateIdentifier(): string {
    const length = Math.ceil(jStat.gamma.sample(ID_GAMMA_SHAPE, ID_GAMMA_SCALE)) as number;
    let identifier = ALPHA_CHARSET[Math.floor(Math.random() * ALPHA_CHARSET.length)];

    for (let i = 1; i < length; i += 1) {
      identifier += ALPHA_NUMERIC_CHARSET[Math.floor(Math.random() * ALPHA_NUMERIC_CHARSET.length)];
    }

    if (keywords.has(identifier.toLowerCase())) {
      return this.generateIdentifier();
    }
    return identifier;
  }

  private generateString(): string {
    const length = jStat.gamma.sample(STRING_GAMMA_SHAPE, STRING_GAMMA_SCALE) as number;
    return `"${this.generateRandomString(length)}"`;
  }

  private generateToken(tokenType: TokenType): string {
    switch (tokenType) {
      case TokenType.plus:
        return ' + ';
      case TokenType.minus:
        return ' - ';
      case TokenType.multi:
        return ' * ';
      case TokenType.div:
        return ' / ';
      case TokenType.power:
        return '^';
      case TokenType.not:
        return 'not ';
      case TokenType.and:
        return ' and ';
      case TokenType.or:
        return ' or ';
      case TokenType.true:
        return 'true';
      case TokenType.false:
        return 'false';
      case TokenType.equal:
        return ' = ';
      case TokenType.notEqual:
        return ' <> ';
      case TokenType.greaterEqual:
        return ' >= ';
      case TokenType.greater:
        return ' > ';
      case TokenType.lessEqual:
        return ' <= ';
      case TokenType.less:
        return ' < ';
      case TokenType.set:
        return 'set';
      case TokenType.unset:
        return 'unset';
      case TokenType.to:
        return 'to';
      case TokenType.is:
        return 'is';
      case TokenType.until:
        return 'until';
      case TokenType.if:
        return 'if';
      case TokenType.else:
        return 'else';
      case TokenType.for:
        return 'for';
      case TokenType.when:
        return 'when';
      case TokenType.then:
        return 'then';
      case TokenType.from:
        return 'from';
      case TokenType.do:
        return 'do';
      case TokenType.at:
        return 'at';
      case TokenType.on:
        return 'on';
      case TokenType.in:
        return 'in';
      case TokenType.lock:
        return 'lock';
      case TokenType.unlock:
        return 'unlock';
      case TokenType.print:
        return 'print';
      case TokenType.arrayIndex:
        return '#';
      case TokenType.integer:
        return this.generateInteger();
      case TokenType.double:
        return this.generateDouble();
      case TokenType.string:
        return this.generateString();
      case TokenType.local:
        return 'local';
      case TokenType.global:
        return 'global';
      case TokenType.parameter:
        return 'parameter';
      case TokenType.function:
        return 'function';
      case TokenType.preserve:
        return 'preserve';
      case TokenType.break:
        return 'break';
      case TokenType.return:
        return 'return';
      case TokenType.declare:
        return 'declare';
      case TokenType.defined:
        return 'defined ';
      case TokenType.bracketOpen:
        return '(';
      case TokenType.bracketClose:
        return ')';
      case TokenType.curlyOpen:
        return '{';
      case TokenType.curlyClose:
        return '}';
      case TokenType.squareOpen:
        return '[';
      case TokenType.squareClose:
        return ']';
      case TokenType.comma:
        return ',';
      case TokenType.colon:
        return ':';
      case TokenType.period:
        return '.';
      case TokenType.atSign:
        return '@';
      case TokenType.eof:
        return '';
      case TokenType.toggle:
        return 'toggle';
      case TokenType.wait:
        return 'wait';
      case TokenType.off:
        return 'off';
      case TokenType.list:
        return 'list';
      case TokenType.clearscreen:
        return 'clearscreen';
      case TokenType.stage:
        return 'stage';
      case TokenType.add:
        return 'add';
      case TokenType.remove:
        return 'remove';
      case TokenType.log:
        return 'log';
      case TokenType.step:
        return 'step';
      case TokenType.switch:
        return 'switch';
      case TokenType.copy:
        return 'copy';
      case TokenType.rename:
        return 'rename';
      case TokenType.volume:
        return 'volume';
      case TokenType.file:
        return 'file';
      case TokenType.delete:
        return 'delete';
      case TokenType.edit:
        return 'edit';
      case TokenType.all:
        return 'all';
      case TokenType.run:
        return 'run';
      case TokenType.runPath:
        return 'runpath';
      case TokenType.runOncePath:
        return 'runoncepath';
      case TokenType.once:
        return 'once';
      case TokenType.compile:
        return 'compile';
      case TokenType.reboot:
        return 'reboot';
      case TokenType.shutdown:
        return 'shutdown';
      case TokenType.identifier:
        return this.generateIdentifier();
      case TokenType.fileIdentifier:
        return `${this.generateIdentifier()}.${this.generateIdentifier()}`;
      case TokenType.lazyGlobal:
        return 'lazyglobal';
      default:
        throw new Error(`Unknown token ${tokenType} encounted`);
    }
  }
}

const isNode = (node: GrammarNode)
  : node is TokenType | IExprClass | IStmtClass | ISuffixTermClass => {
  if (node.hasOwnProperty('tag')) {
    return false;
  }

  return true;
};
