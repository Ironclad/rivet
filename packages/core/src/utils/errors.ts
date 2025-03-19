import type { ChartNode } from '../model/NodeBase.js';

export class NodeError extends Error {
  constructor(
    message: string,
    public readonly node: ChartNode,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/** Gets an Error from an unknown error object (strict unknown errors is enabled, helper util). */
export function getError(error: unknown): Error {
  const errorInstance =
    typeof error === 'object' && error instanceof Error
      ? error
      : new Error(error != null ? error.toString() : 'Unknown error');
  return errorInstance;
}

export function rivetErrorToString(error: unknown, spaces = 0): string {
  if (!(error instanceof Error)) {
    if (error == null) {
      return 'Unknown error';
    }

    return String(error);
  }

  if (error instanceof AggregateError) {
    return error.message + '\n' + error.errors.map((e) => ' - ' + rivetErrorToString(e, spaces + 4)).join('\n');
  }

  let message = error.message;
  if (error instanceof NodeError) {
    const { node } = error;
    message = `${node.title} (${node.id}): ${error.message}`;
  }

  if (error.cause) {
    message += `\nCaused by: ${rivetErrorToString(error.cause)}`;
  }

  return indent(message, spaces);
}

function indent(str: string, spaces: number): string {
  const spacing = ' '.repeat(spaces);
  return str
    .split('\n')
    .map((line, i) => (i === 0 ? line : spacing + line))
    .join('\n');
}
