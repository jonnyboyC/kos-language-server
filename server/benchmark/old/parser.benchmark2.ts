import { Scanner } from '../../src/scanner/scanner';
import { walkDir } from '../../src/utilities/fsUtils';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { Parser } from '../../src/parser/parser';
import { benchmark } from '@dynatrace/zakzak';

benchmark('temp', () => {
  const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');

  interface IBenchResult {
    size: number;
    time: number;
    rate: number;
    filePath: string;
  }

  walkDir(testDir, filePath => {
    const kosFile = readFileSync(filePath, 'utf8');
    const scanner = new Scanner(kosFile);
    const { tokens } = scanner.scanTokens();

    const parser = new Parser('', tokens);
    parser.parse();
  });

  let results: IBenchResult[] = [];

  for (let i = 0; i < 10; i += 1) {
    walkDir(testDir, filePath => {
      const size = statSync(filePath).size;

      const kosFile = readFileSync(filePath, 'utf8');

      const scanner = new Scanner(kosFile);
      const { tokens } = scanner.scanTokens();

      const start = performance.now();
      const parser = new Parser('', tokens);
      parser.parse();
      const end = performance.now();

      results.push({
        filePath,
        size: size / 1024,
        time: end - start,
        rate: size / (((end - start) / 1000) * 1024),
      });
    });
  }

  results = results.sort((x, y) => y.rate - x.rate);
  for (const result of results) {
    console.log(
      `file path: ${result.filePath} size: ${result.size.toFixed(
        1,
      )} KB, time ${result.time.toFixed(2)} ms ${result.rate.toFixed(2)} KB/s`,
    );
  }

  let time = 0;
  let size = 0;

  for (const result of results) {
    time += result.time;
    size += result.size;
  }

  console.log(`Overall rate ${size / (time / 1000)} KB/s`);
});
