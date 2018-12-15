import test from 'ava';
import { Scanner } from './scanner';
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path';
import { ISyntaxError } from './types';
import { IToken } from '../entities/types';


const testDir = join(__dirname, '../../../kerboscripts');

type callbackFunc = (fileName: string) => void;

const walkDir = (dir: string, callback: callbackFunc): void => {
    readdirSync(dir).forEach( f => {
      let dirPath = join(dir, f);
      let isDirectory = statSync(dirPath).isDirectory();
      isDirectory ? 
        walkDir(dirPath, callback) : callback(join(dir, f));
    });
};

test('scan all', (t) => {
    walkDir(testDir, (filePath) => {
        const kosFile = readFileSync(filePath, 'utf8');

        const scanner = new Scanner(kosFile);
        const result = scanner.scanTokens();

        t.true(isToken(result));
    });
});
  
const isToken = (result: IToken[] | ISyntaxError[]): result is IToken[] => {
    return result[0].tag === 'token'
}
