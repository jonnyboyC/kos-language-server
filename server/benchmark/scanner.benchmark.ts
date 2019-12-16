import { suite, benchmark, setup } from '@dynatrace/zakzak';
import { Scanner } from '../src/scanner/scanner';
import { join } from 'path';
import { readFileSync } from 'fs';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');
const fakeUri = 'file:///fake/base';

suite('scanner', () => {
  let ap: string;
  let boostback: string;
  let allLanguage: string;

  setup(() => {
    ap = readFileSync(join(testDir, 'ap.ks'), 'utf8');
    boostback = readFileSync(join(testDir, 'boostback.ks'), 'utf8');
    allLanguage = readFileSync(
      join(testDir, 'unitTests', 'allLanguage.ks'),
      'utf8',
    );
  });

  benchmark('construct', () => {
    new Scanner('', '');
    return true;
  });

  benchmark('ap.ks', () => {
    new Scanner(ap, fakeUri).scanTokens();
    return true;
  });

  benchmark('boostback.ks', () => {
    new Scanner(boostback, fakeUri).scanTokens();
    return true;
  });

  benchmark('allLanguage.ks', () => {
    new Scanner(allLanguage, fakeUri).scanTokens();
    return true;
  });
});
