import { dedent } from './misc.js';

export const TOKEN_MATCH_REGEX = /\{\{(?!\{)([^{}\s][^{}]*[^{}\s]|[^{}\s])\}\}(?!\})/g;

export const ESCAPED_TOKEN_REGEX = /\{{3}([^{}]+)\}{3}/g;

// Processing functions
type ProcessingFunction = (input: string, param?: number) => string;

const processingFunctions: Record<string, ProcessingFunction> = {
  indent: (input: string, spaces: number = 0) => {
    const indent = ' '.repeat(spaces);
    return input
      .split('\n')
      .map((line) => `${indent}${line}`)
      .join('\n');
  },

  quote: (input: string, level: number = 1) => {
    const quotePrefix = '> '.repeat(level);
    return input
      .split('\n')
      .map((line) => `${quotePrefix}${line}`)
      .join('\n');
  },

  uppercase: (input: string) => {
    return input.toUpperCase();
  },

  lowercase: (input: string) => {
    return input.toLowerCase();
  },

  trim: (input: string) => {
    return input.trim();
  },

  truncate: (input: string, length: number = 50) => {
    if (input.length <= length) return input;
    return input.slice(0, length) + '...';
  },

  list: (input: string, level: number = 1) => {
    const indent = '  '.repeat(level - 1);
    return input
      .split('\n')
      .map((line) => `${indent}- ${line}`)
      .join('\n');
  },

  sort: (input: string) => {
    return input.split('\n').sort().join('\n');
  },

  dedent: (input: string) => {
    return dedent(input);
  },

  wrap: (input: string, width: number = 80) => {
    const words = input.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  },
};

// Parse processing instructions like "indent 2" or "quote" into function name and parameter
function parseProcessing(instruction: string): { func: string; param?: number } {
  const parts = instruction.trim().split(/\s+/);
  return {
    func: parts[0]!,
    param: parts[1] ? parseInt(parts[1], 10) : undefined,
  };
}

// Apply a chain of processing functions to a string
function applyProcessing(value: string, processingChain: string): string {
  const instructions = processingChain.split('|').slice(1); // Remove the token part

  return instructions.reduce((result, instruction) => {
    const { func, param } = parseProcessing(instruction);
    const processingFunc = processingFunctions[func];

    if (!processingFunc) {
      console.warn(`Unknown processing function: ${func}`);
      return result;
    }

    return processingFunc(result, param);
  }, value);
}

export function interpolate(baseString: string, values: Record<string, string>): string {
  return baseString
    .replace(TOKEN_MATCH_REGEX, (_m, p1) => {
      const [token, ...processing] = p1.split('|');
      const value = values[token.trim()];

      if (value === undefined) return '';

      if (processing.length > 0) {
        return applyProcessing(value, p1);
      }

      return value;
    })
    .replace(ESCAPED_TOKEN_REGEX, (_m, p1) => {
      return `{{${p1}}}`;
    });
}

// Extract all unique variable names from a template string
export function extractInterpolationVariables(template: string): string[] {
  const matches = template.matchAll(TOKEN_MATCH_REGEX);
  const variables = new Set<string>();

  for (const match of matches) {
    const [token] = match[1]!.split('|');
    variables.add(token!.trim());
  }

  return Array.from(variables);
}
