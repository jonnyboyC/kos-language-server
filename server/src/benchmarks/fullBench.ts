import { Scanner } from '../scanner/scanner';
import { walkDir } from '../utilities/fsUtils';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { Parser } from '../parser/parser';
import { SymbolTableBuilder } from '../analysis/symbolTableBuilder';
import { PreResolver } from '../analysis/preResolver';
import { Resolver } from '../analysis/resolver';
import { standardLibraryBuilder } from '../analysis/standardLibrary';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');

interface IBenchResult {
  size: number;
  time: number;
  rate: number;
  filePath: string;
}

// jit warm up
walkDir(testDir, (filePath) => {
  const kosFile = readFileSync(filePath, 'utf8');
  const scanner = new Scanner(kosFile);
  const { tokens } = scanner.scanTokens();

  const parser = new Parser('', tokens);
  const { script } = parser.parse();

  const symbolTableBuilder = new SymbolTableBuilder('');
  symbolTableBuilder.linkTable(standardLibraryBuilder(CaseKind.lowercase));

  const preResolver = new PreResolver(script, symbolTableBuilder);
  const resolver = new Resolver(script, symbolTableBuilder);
  preResolver.resolve();
  resolver.resolve();
});

let scanResults: IBenchResult[] = [];
let parseResults: IBenchResult[] = [];
let resolverResults: IBenchResult[] = [];

for (let i = 0; i < 10; i += 1) {
  walkDir(testDir, (filePath) => {
    const size = statSync(filePath).size;

    const kosFile = readFileSync(filePath, 'utf8');

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
    symbolTableBuilder.linkTable(standardLibraryBuilder(CaseKind.lowercase));

    const preResolver = new PreResolver(script, symbolTableBuilder);
    const resolver = new Resolver(script, symbolTableBuilder);
    preResolver.resolve();
    resolver.resolve();

    symbolTableBuilder.findUnused();
    const resolveEnd = performance.now();

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
  });
}

scanResults = scanResults.sort((x, y) => (y.rate - x.rate));
parseResults = parseResults.sort((x, y) => (y.rate - x.rate));
resolverResults = resolverResults.sort((x, y) => (y.rate - x.rate));


for (const result of scanResults) {
  // tslint:disable-next-line:max-line-length
  console.log(`file path: ${result.filePath} size: ${result.size.toFixed(1)} KB, time ${result.time.toFixed(2)} ms ${result.rate.toFixed(2)} KB/s`);
}

console.log();
console.log('--------------------------Parser------------------------------');
console.log();

for (const result of parseResults) {
  // tslint:disable-next-line:max-line-length
  console.log(`file path: ${result.filePath} size: ${result.size.toFixed(1)} KB, time ${result.time.toFixed(2)} ms ${result.rate.toFixed(2)} KB/s`);
}

console.log();
console.log('--------------------------Resolver------------------------------');
console.log();

for (const result of resolverResults) {
  // tslint:disable-next-line:max-line-length
  console.log(`file path: ${result.filePath} size: ${result.size.toFixed(1)} KB, time ${result.time.toFixed(2)} ms ${result.rate.toFixed(2)} KB/s`);
}

let scanTime = 0;
let parseTime = 0;
let resolveTime = 0;
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

// tslint:disable-next-line:max-line-length
console.log(`Overall scan rate ${size / (scanTime / 1000)} KB/s`);
console.log(`Overall parse rate ${size / (parseTime / 1000)} KB/s`);
console.log(`Overall resolver rate ${size / (resolveTime / 1000)} KB/s`);
