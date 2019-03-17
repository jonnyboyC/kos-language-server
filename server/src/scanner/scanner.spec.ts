import ava from 'ava';
import { Scanner } from './scanner';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');

type callbackFunc = (fileName: string) => void;

const walkDir = (dir: string, callback: callbackFunc): void => {
  readdirSync(dir).forEach((f) => {
    const dirPath = join(dir, f);
    const isDirectory = statSync(dirPath).isDirectory();
    isDirectory ?
      walkDir(dirPath, callback) : callback(join(dir, f));
  });
};

ava('scan all', (t) => {
  walkDir(testDir, (filePath) => {
    const kosFile = readFileSync(filePath, 'utf8');

    const scanner = new Scanner(kosFile);
    const { tokens, scanErrors } = scanner.scanTokens();
    const errorResult = scanErrors.map(error => ({ filePath, ...error }));

    t.true(tokens.length > 0);
    t.true(errorResult.length === 0);
  });
});
