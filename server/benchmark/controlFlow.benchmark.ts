import { suite, benchmark, setup } from '@dynatrace/zakzak';
import { join } from 'path';
import { readFileSync } from 'fs';
import { Parser } from '../src/parser/parser';
import { parseSource } from '../test/utilities/setup';
import { ControlFlow } from '../src/controlFlow/controlFlow';

const testDir = join(__dirname, '../../../kerboscripts/parser_valid/');

suite('praser', () => {
  let ap: ReturnType<typeof parseSource>;
  let boostback: ReturnType<typeof parseSource>;
  let allLanguage: ReturnType<typeof parseSource>;

  setup(() => {
    ap = parseSource(readFileSync(join(testDir, 'ap.ks'), 'utf8'));
    boostback = parseSource(
      readFileSync(join(testDir, 'boostback.ks'), 'utf8'),
    );
    allLanguage = parseSource(
      readFileSync(join(testDir, 'unitTests', 'allLanguage.ks'), 'utf8'),
    );
  });

  benchmark('construct', () => {
    new Parser('', []);
    return 1;
  });

  benchmark('ap.ks', () => {
    const cfd = new ControlFlow(ap.parse.script).flow();
    cfd!.reachable();
    return 1;
  });

  benchmark('boostback.ks', () => {
    const cfd = new ControlFlow(boostback.parse.script).flow();
    cfd!.reachable();
    return 1;
  });

  benchmark('allLanguage.ks', () => {
    const cfd = new ControlFlow(allLanguage.parse.script).flow();
    cfd!.reachable();
    return 1;
  });
});
