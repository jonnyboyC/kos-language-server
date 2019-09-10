import { Generator } from './generator';
import { consoleLogger, consoleTracer } from '../utilities/logger';
import { validExprTypes } from '../parser/expr';
import { Scanner } from '../scanner/scanner';
import { Parser } from '../parser/parser';
import { INodeResult, IExpr } from '../parser/types';
import { Diagnostic } from 'vscode-languageserver';

const generator = new Generator({ active: false, rate: 0 }, consoleLogger, consoleTracer);
// scan source file
const scan = (source: string) => {
  const scanner = new Scanner(source);
  return scanner.scanTokens();
};

// parse source
const parseExpression = (source: string): [INodeResult<IExpr>, Diagnostic[]] => {
  const { tokens, scanDiagnostics: scanErrors } = scan(source);
  const parser = new Parser('', tokens);
  return [parser.parseExpression(), scanErrors];
};

let i = 0;
while (true) {
  for (const exprClass of validExprTypes.slice(0, -1)) {
    if (i % 100 === 0) {
      console.log(i);
    }

    const source = generator.generateExpr(exprClass[0]);
    i += 1;

    try {
      const [{ errors }, scanErrors] = parseExpression(source);
      if (errors.length > 0 || scanErrors.length > 0) {
        console.log('Source: ', source);
        errors.map(error => console.log('Parse Error: ', error));
        scanErrors.map(error => console.log('Parse Error: ', error));
        process.exit();
      }

    } catch (err) {
      console.log(err);
    }
  }
}
