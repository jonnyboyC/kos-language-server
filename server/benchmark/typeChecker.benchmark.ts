import { suite, benchmark, setup } from '@dynatrace/zakzak';
import { join } from 'path';
import { readFileSync } from 'fs';
import { resolveSource, IResolveResults } from '../test/utilities/setup';
import { SymbolTable } from '../src/analysis/models/symbolTable';
import { typeInitializer } from '../src/typeChecker/initialize';
import { TypeChecker } from '../src/typeChecker/typeChecker';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');
const fakeUri = 'file:///fake/base';

suite('type checker', () => {
  let ap: IResolveResults;
  let boostback: IResolveResults;
  let allLanguage: IResolveResults;

  let libUi: SymbolTable;
  let steeringManager: SymbolTable;

  setup(() => {
    typeInitializer();

    libUi = resolveSource(
      readFileSync(join(testDir, 'lib_UI.ks'), 'utf8'),
      fakeUri,
      true,
    ).table;
    steeringManager = resolveSource(
      readFileSync(join(testDir, 'steeringmanager.ks'), 'utf8'),
      fakeUri,
      true,
    ).table;

    ap = resolveSource(
      readFileSync(join(testDir, 'ap.ks'), 'utf8'),
      fakeUri,
      true,
      libUi,
      steeringManager,
    );
    boostback = resolveSource(
      readFileSync(join(testDir, 'boostback.ks'), 'utf8'),
      fakeUri,
      true,
    );
    allLanguage = resolveSource(
      readFileSync(join(testDir, 'unitTests', 'allLanguage.ks'), 'utf8'),
      fakeUri,
      true,
    );
  });

  benchmark('construct', () => {
    new TypeChecker(ap.parse.script);
  });

  benchmark('ap.ks', () => {
    const checker = new TypeChecker(ap.parse.script);
    checker.check();
  });

  benchmark('boostback.ks', () => {
    const checker = new TypeChecker(boostback.parse.script);
    checker.check();
  });

  benchmark('allLanguage.ks', () => {
    const checker = new TypeChecker(allLanguage.parse.script);
    checker.check();
  });
});
