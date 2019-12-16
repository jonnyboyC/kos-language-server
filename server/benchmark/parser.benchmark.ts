import { suite, benchmark, setup } from '@dynatrace/zakzak';
import { Scanner } from '../src/scanner/scanner';
import { join } from 'path';
import { readFileSync } from 'fs';
import { Parser } from '../src/parser/parser';
import { Tokenized } from '../src/scanner/types';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');
const fakeUri = 'file:///fake/base';

suite('praser', () => {
  let ap: Tokenized;
  let boostback: Tokenized;
  let allLanguage: Tokenized;

  setup(() => {
    ap = new Scanner(
      readFileSync(join(testDir, 'ap.ks'), 'utf8'),
      fakeUri,
    ).scanTokens();
    boostback = new Scanner(
      readFileSync(join(testDir, 'boostback.ks'), 'utf8'),
      fakeUri,
    ).scanTokens();
    allLanguage = new Scanner(
      readFileSync(join(testDir, 'unitTests', 'allLanguage.ks'), 'utf8'),
      fakeUri,
    ).scanTokens();
  });

  benchmark('construct', () => {
    new Parser('', []);
    return true;
  });

  benchmark('ap.ks', () => {
    new Parser(fakeUri, ap.tokens).parse();
    return true;
  });

  benchmark('boostback.ks', () => {
    new Parser(fakeUri, boostback.tokens).parse();
    return true;
  });

  benchmark('allLanguage.ks', () => {
    new Parser(fakeUri, allLanguage.tokens).parse();
    return true;
  });
});
