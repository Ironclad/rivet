import type { Inputs, Outputs } from '../model/GraphProcessor.js';
import type { DataValue } from '../model/DataValue.js';

// eslint-disable-next-line import/no-cycle -- There has to be a cycle if we're to import the entirety of Rivet here.
import * as Rivet from '../exports.js';

export interface CodeRunnerOptions {
  includeRequire: boolean;
  includeFetch: boolean;
  includeRivet: boolean;
  includeProcess: boolean;
  includeConsole: boolean;
}

/** An object that can run arbitrary code (evals it). */
export interface CodeRunner {
  runCode: (
    code: string,
    inputs: Inputs,
    options: CodeRunnerOptions,
    graphInputs?: Record<string, DataValue>
  ) => Promise<Outputs>;
}

export class IsomorphicCodeRunner implements CodeRunner {
  async runCode(
    code: string,
    inputs: Inputs,
    options: CodeRunnerOptions,
    graphInputs?: Record<string, DataValue>
  ): Promise<Outputs> {
    const argNames = ['inputs'];
    const args: any[] = [inputs];

    if (options.includeRequire) {
      throw new Error('require() requires the Node executor.');
    }

    if (options.includeProcess) {
      throw new Error('process requires the Node executor.');
    }

    if (options.includeConsole) {
      argNames.push('console');
      args.push(console);
    }

    if (options.includeFetch) {
      argNames.push('fetch');
      args.push(fetch);
    }

    if (options.includeRivet) {
      argNames.push('Rivet');
      args.push(Rivet);
    }

    if (graphInputs) {
      argNames.push('graphInputs');
      args.push(graphInputs);
    }

    // Ensure code is the last argument for the AsyncFunction constructor
    argNames.push(code);

    const AsyncFunction = async function () {}.constructor as new (...args: string[]) => Function;
    // Constructor takes the argument names, with the code string as the last element
    const codeFunction = new AsyncFunction(...argNames);
    // Call the created function with the corresponding argument values
    const outputs = await codeFunction(...args);

    return outputs;
  }
}

export class NotAllowedCodeRunner implements CodeRunner {
  async runCode(
    _code: string,
    _inputs: Inputs,
    _options: CodeRunnerOptions,
    _graphInputs?: Record<string, DataValue>
  ): Promise<Outputs> {
    throw new Error('Dynamic code execution is disabled.');
  }
}
