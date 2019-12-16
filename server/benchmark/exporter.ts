import { Exporter, Suite, BenchmarkResult, TimeUnit } from '@dynatrace/zakzak';
import { relative } from 'path';

const toTime = (time: number) => {
  if (time < TimeUnit.Microsecond) {
    return `${time.toFixed(2)} ns`;
  }

  if (time < TimeUnit.Millisecond) {
    const microseconds = time / TimeUnit.Microsecond;
    return `${microseconds.toFixed(2)} μs`;
  }

  if (time < TimeUnit.Second) {
    const millisecond = time / TimeUnit.Millisecond;
    return `${millisecond.toFixed(2)} ms`;
  }

  const seconds = time / TimeUnit.Second;
  return `${seconds.toFixed(2)} s`;
};

// const toMemory = () => {};

export class KosExporter extends Exporter {
  public totalBenchmarks: number = 0;
  public totalSuites: number = 0;
  public currentBenchIndex: number = 0;

  onHierarchy(root: Suite[], depth = 0): void {
    for (const suite of root) {
      this.totalSuites++;

      if (depth === 0) {
        console.log(relative(__dirname, suite.filename));
      } else {
        console.log(
          `${'|   '.repeat(depth)}${relative(__dirname, suite.filename)}`,
        );
      }

      const childSuites: Suite[] = [];
      for (const childSuite of childSuites) {
        if (childSuite instanceof Suite) {
          childSuites.push(childSuite);
        } else {
          this.totalBenchmarks++;
        }
      }

      this.onHierarchy(childSuites, depth + 1);
    }

    if (depth === 0) {
      console.log();
      console.log(`Discovered ${this.totalSuites} benchmark suites`);
      console.log(`Discovered ${this.totalBenchmarks} benchmarks`);
      console.log();
    }
  }
  onResult(result: BenchmarkResult): void {
    const relativeId = relative(__dirname, result.id);
    const splits = relativeId.split(':');

    console.log(`${splits[0]} >> ${splits.slice(1).join(' >> ')}`);
    console.log();
    console.log(
      `    ${result.name}: mean: ${toTime(result.stats.mean)} memory: ${
        result.memoryUsage
      }`,
    );
    console.log();
  }
  onFinished(results: BenchmarkResult[]): void {
    console.log(`${results.length} benchmarks ran successfully`);
  }
  onError(error: Error, id: string): void {
    console.log(id + ' ' + error.message);
  }
}
