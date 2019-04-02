import ava from 'ava';
import { Scanner } from './scanner';
import { readFileSync } from 'fs';
import { join } from 'path';
import { walkDir } from '../utilities/fsUtilities';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');

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
