import { suite, benchmark, setup } from '@dynatrace/zakzak';
import { join } from 'path';
import { readFileSync } from 'fs';
import { parseSource, resolveSource } from '../test/utilities/setup';
import { Ast } from '../src/parser/types';
import { PreResolver } from '../src/analysis/preResolver';
import { SymbolTableBuilder } from '../src/analysis/models/symbolTableBuilder';
import { Resolver } from '../src/analysis/resolver';
import { SymbolTable } from '../src/analysis/models/symbolTable';
import { typeInitializer } from '../src/typeChecker/initialize';
import { standardLibraryBuilder, bodyLibraryBuilder } from '../src/analysis/standardLibrary';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');
const fakeUri = 'file:///fake/base';

suite('resolver', () => {
  let ap: Ast;
  let boostback: Ast;
  let allLanguage: Ast;

  let libUi: SymbolTable;
  let steeringManager: SymbolTable;

  let std: SymbolTable;
  let bodies: SymbolTable;

  setup(() => {
    typeInitializer();

    ap = parseSource(readFileSync(join(testDir, 'ap.ks'), 'utf8')).parse;
    boostback = parseSource(readFileSync(join(testDir, 'boostback.ks'), 'utf8'))
      .parse;
    allLanguage = parseSource(
      readFileSync(join(testDir, 'unitTests', 'allLanguage.ks'), 'utf8'),
    ).parse;

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

    std = standardLibraryBuilder(CaseKind.camelCase);
    bodies = bodyLibraryBuilder(CaseKind.camelCase);
  });

  suite('no imports', () => {
    benchmark('construct', () => {
      const builder = new SymbolTableBuilder(fakeUri);
      new PreResolver(ap.script, builder);
      new Resolver(ap.script, builder);
    });

    benchmark('ap.ks', () => {
      const builder = new SymbolTableBuilder(fakeUri);
      const pre = new PreResolver(ap.script, builder);
      pre.resolve();

      const main = new Resolver(ap.script, builder);
      main.resolve();
      builder.build();
    });

    benchmark('boostback.ks', () => {
      const builder = new SymbolTableBuilder(fakeUri);
      const pre = new PreResolver(boostback.script, builder);
      pre.resolve();

      const main = new Resolver(boostback.script, builder);
      main.resolve();
      builder.build();
    });

    benchmark('allLanguage.ks', () => {
      const builder = new SymbolTableBuilder(fakeUri);
      const pre = new PreResolver(allLanguage.script, builder);
      pre.resolve();

      const main = new Resolver(allLanguage.script, builder);
      main.resolve();
      builder.build();
    });
  });

  suite('when imports', () => {
    benchmark('ap.ks', () => {
      const builder = new SymbolTableBuilder(fakeUri);

      builder.dependentTables.add(std);
      builder.dependentTables.add(bodies);
      builder.dependentTables.add(libUi);
      builder.dependentTables.add(steeringManager);

      const pre = new PreResolver(ap.script, builder);
      pre.resolve();

      const main = new Resolver(ap.script, builder);
      main.resolve();
      builder.build();
    });

    benchmark('boostback.ks', () => {
      const builder = new SymbolTableBuilder(fakeUri);

      builder.dependentTables.add(std);
      builder.dependentTables.add(bodies);

      const pre = new PreResolver(boostback.script, builder);
      pre.resolve();

      const main = new Resolver(boostback.script, builder);
      main.resolve();
      builder.build();
    });

    benchmark('allLanguage.ks', () => {
      const builder = new SymbolTableBuilder(fakeUri);

      builder.dependentTables.add(std);
      builder.dependentTables.add(bodies);

      const pre = new PreResolver(allLanguage.script, builder);
      pre.resolve();

      const main = new Resolver(allLanguage.script, builder);
      main.resolve();
      builder.build();
    });
  });
});
