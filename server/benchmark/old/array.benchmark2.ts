import { benchmark } from '@dynatrace/zakzak';
import { performance } from 'perf_hooks';

benchmark('temp', () => {
  const a: number[] = [1, 2, 3];
  let c: number[] = [];

  const catStart = performance.now();

  for (let i = 0; i < 10000; i++) {
    c = c.concat(a, a, a);
  }
  const catEnd = performance.now();

  const pushStart = performance.now();

  for (let i = 0; i < 10000; i++) {
    c.push(...a, ...a, ...a);
  }
  const pushEnd = performance.now();

  console.log(`concat: ${catEnd - catStart}`);
  console.log(`push: ${pushEnd - pushStart}`);
});
