import type { CodeRunner, CodeRunnerOptions, DataValue, Inputs, Outputs } from '@ironclad/rivet-core';
import { createRequire } from 'node:module';
import * as process from 'node:process';

export class NodeCodeRunner implements CodeRunner {
  async runCode(
    code: string,
    inputs: Inputs,
    options: CodeRunnerOptions,
    graphInputs?: Record<string, DataValue>
  ): Promise<Outputs> {
    const argNames = ['inputs'];
    const args: any[] = [inputs];

    if (options.includeConsole) {
      argNames.push('console');
      args.push(console);
    }

    if (options.includeRequire) {
      argNames.push('require');
      const require = createRequire(import.meta.url);
      args.push(require);
    }

    if (options.includeProcess) {
      argNames.push('process');
      args.push(process);
    }

    if (options.includeFetch) {
      argNames.push('fetch');
      args.push(fetch);
    }

    if (options.includeRivet) {
      const Rivet = await import('@ironclad/rivet-node');

      argNames.push('Rivet');
      args.push(Rivet);
    }

    if (graphInputs) {
      argNames.push('graphInputs');
      args.push(graphInputs);
    }

    argNames.push(code);

    const AsyncFunction = async function () {}.constructor as new (...args: string[]) => Function;
    const codeFunction = new AsyncFunction(...argNames);
    const outputs = await codeFunction(...args);

    return outputs;
  }
}
