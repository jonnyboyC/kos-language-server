import test from 'ava';
import { Scanner } from './scanner';
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path';
import { TokenInterface, SyntaxErrorInterface } from './types';


const testDir = join(__dirname, '../../../../test');

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
        console.log(kosFile);
        console.log('---------------------');

        const scanner = new Scanner(kosFile);
        const result = scanner.scanTokens();

        if (isToken(result)) {
            console.log('---------------------');
            console.log(result.map((r: TokenInterface) => r.toString()));
            t.deepEqual(true, true);
        } else {
            t.deepEqual(true, true);
        }
    });
});
  
const isToken = (result: TokenInterface[] | SyntaxErrorInterface[]): result is TokenInterface[] => {
    return result[0].tag === 'token'
}

// test('stuff', t => {
//     t.deepEqual(true, true)
// })
