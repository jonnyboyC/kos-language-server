import { Scanner } from '../scanner/scanner';
import { walkDir } from '../utilities/fsUtils';
import { readFileSync, statSync, createWriteStream } from 'fs';
import { join, relative } from 'path';
import { performance } from 'perf_hooks';
import { Parser } from '../parser/parser';
import { SymbolTableBuilder } from '../analysis/symbolTableBuilder';
import { PreResolver } from '../analysis/preResolver';
import { Resolver } from '../analysis/resolver';
import { standardLibraryBuilder } from '../analysis/standardLibrary';
import { TypeChecker } from '../typeChecker/typeChecker';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');

const logger = createWriteStream('bench.txt', { flags: 'a' });
const log = (line: string): void => {
  console.log(line);
  // tslint:disable-next-line: prefer-template
  logger.write(line + '\n');
};

interface IBenchResult {
  size: number;
  time: number;
  rate: number;
  filePath: string;
}

const standardLibrary = standardLibraryBuilder(CaseKind.lowercase);

const scriptSources: { kosFile: string, filePath: string, size: number}[] = [];

// jit warm up
walkDir(testDir, (filePath) => {
  const size = statSync(filePath).size;

  const kosFile = readFileSync(filePath, 'utf8');
  scriptSources.push({ size, kosFile, filePath });
  const scanner = new Scanner(kosFile);
  const { tokens } = scanner.scanTokens();

  const parser = new Parser('', tokens);
  const { script } = parser.parse();

  const symbolTableBuilder = new SymbolTableBuilder('');
  symbolTableBuilder.linkDependency(standardLibrary);

  const preResolver = new PreResolver(script, symbolTableBuilder);
  const resolver = new Resolver(script, symbolTableBuilder);
  preResolver.resolve();
  resolver.resolve();

  const typeChecker = new TypeChecker(script);
  typeChecker.check();
});

const overallResults: IBenchResult[] = [];
let scanResults: IBenchResult[] = [];
let parseResults: IBenchResult[] = [];
let resolverResults: IBenchResult[] = [];
let typeCheckerResults: IBenchResult[] = [];

for (let i = 0; i < 10; i += 1) {
  for (const { kosFile, size, filePath } of scriptSources) {
    const scannerStart = performance.now();
    const scanner = new Scanner(kosFile);
    const { tokens } = scanner.scanTokens();
    const scannerEnd = performance.now();

    const parserStart = performance.now();
    const parser = new Parser('', tokens);
    const { script } = parser.parse();
    const parserEnd = performance.now();

    const resolverStart = performance.now();
    const symbolTableBuilder = new SymbolTableBuilder('');
    symbolTableBuilder.linkDependency(standardLibrary);

    const preResolver = new PreResolver(script, symbolTableBuilder);
    const resolver = new Resolver(script, symbolTableBuilder);
    preResolver.resolve();
    resolver.resolve();

    symbolTableBuilder.findUnused();
    const resolveEnd = performance.now();

    const typeCheckerStart = performance.now();
    const typeChecker = new TypeChecker(script);
    typeChecker.check();
    const typeCheckerEnd = performance.now();

    scanResults.push({
      filePath,
      size: size / 1024,
      time: scannerEnd - scannerStart,
      rate: size / ((scannerEnd - scannerStart) / 1000 * 1024),
    });

    parseResults.push({
      filePath,
      size: size / 1024,
      time: parserEnd - parserStart,
      rate: size / ((parserEnd - parserStart) / 1000 * 1024),
    });

    resolverResults.push({
      filePath,
      size: size / 1024,
      time: resolveEnd - resolverStart,
      rate: size / ((resolveEnd - resolverStart) / 1000 * 1024),
    });

    typeCheckerResults.push({
      filePath,
      size: size / 1024,
      time: typeCheckerEnd - typeCheckerStart,
      rate: size / ((typeCheckerEnd - typeCheckerStart) / 1000 * 1024),
    });

    overallResults.push({
      filePath,
      size: size / 1024,
      time: typeCheckerEnd - scannerStart,
      rate: size / ((typeCheckerEnd - scannerStart) / 1000 * 1024),
    });
  }
}

scanResults = scanResults.sort((x, y) => (y.rate - x.rate));
parseResults = parseResults.sort((x, y) => (y.rate - x.rate));
resolverResults = resolverResults.sort((x, y) => (y.rate - x.rate));
typeCheckerResults = typeCheckerResults.sort((x, y) => (y.rate - x.rate));

for (const result of scanResults) {
  // tslint:disable-next-line:max-line-length
  log(`file: ${relative(testDir, result.filePath)} size: ${result.size.toFixed(1)} KB, time ${result.time.toFixed(2)} ms ${result.rate.toFixed(2)} KB/s`);
}

log('');
log('--------------------------Parser------------------------------');
log('');

for (const result of parseResults) {
  // tslint:disable-next-line:max-line-length
  log(`file: ${relative(testDir, result.filePath)} size: ${result.size.toFixed(1)} KB, time ${result.time.toFixed(2)} ms ${result.rate.toFixed(2)} KB/s`);
}

log('');
log('--------------------------Resolver------------------------------');
log('');

for (const result of resolverResults) {
  // tslint:disable-next-line:max-line-length
  console.log(`file: ${relative(testDir, result.filePath)} size: ${result.size.toFixed(1)} KB, time ${result.time.toFixed(2)} ms ${result.rate.toFixed(2)} KB/s`);
}

log('');
log('--------------------------Type Checker------------------------------');
log('');

for (const result of typeCheckerResults) {
  // tslint:disable-next-line:max-line-length
  log(`file: ${relative(testDir, result.filePath)} size: ${result.size.toFixed(1)} KB, time ${result.time.toFixed(2)} ms ${result.rate.toFixed(2)} KB/s`);
}

let scanTime = 0;
let parseTime = 0;
let resolveTime = 0;
let typeCheckerTime = 0;
let overallTime = 0;
let size = 0;

for (const result of scanResults) {
  scanTime += result.time;
  size += result.size;
}

for (const result of parseResults) {
  parseTime += result.time;
}

for (const result of resolverResults) {
  resolveTime += result.time;
}

for (const result of typeCheckerResults) {
  typeCheckerTime += result.time;
}

for (const result of overallResults) {
  overallTime += result.time;
}

log('');
log('--------------------------Overall------------------------------');
log('');

log(`Overall scan rate ${size / (scanTime / 1000)} KB/s`);
log(`Overall parse rate ${size / (parseTime / 1000)} KB/s`);
log(`Overall resolver rate ${size / (resolveTime / 1000)} KB/s`);
log(`Overall type check rate ${size / (typeCheckerTime / 1000)} KB/s`);
log(`Overall rate ${size / (overallTime / 1000)} KB/s`);
