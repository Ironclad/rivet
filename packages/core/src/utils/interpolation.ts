import { dedent } from './misc.js';
import { type DataValue } from '../model/DataValue.js';
import { get } from 'lodash-es';

// Simpler regex allowing spaces, relies on trim() later
export const TOKEN_MATCH_REGEX = /\{\{([^}]+?)\}\}/g;
export const ESCAPED_TOKEN_REGEX = /\{\{\{([^}]+?)\}\}\}/g;

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

export function interpolate(
  baseString: string,
  values: Record<string, string>,
  graphInputValues?: Record<string, DataValue>,
): string {
  return baseString
    .replace(TOKEN_MATCH_REGEX, (_m, p1) => {
      const [tokenPart, ...processing] = p1.trim().split('|');
      const token = tokenPart.trim();

      let value: string | undefined;

      const graphInputPrefix = '@input.';
      if (token.startsWith(graphInputPrefix) && graphInputValues) {
        const expression = token.substring(graphInputPrefix.length);

        // Find the end of the input_id and the start of the path
        const pathStartIndex = expression.search(/[.[]/);
        let graphInputId: string;
        let path: string | undefined;

        if (pathStartIndex === -1) {
          graphInputId = expression; // No path, just the ID
          path = undefined;
        } else {
          graphInputId = expression.substring(0, pathStartIndex);
          const rawPath = expression.substring(pathStartIndex);
          // Clean the path: remove spaces around '.' and '[]'
          const cleanedPath = rawPath.replace(/\s*\.\s*/g, '.').replace(/\s*\[\s*/g, '[').replace(/\s*\]\s*/g, ']');
          // Remove leading dot for lodash/get (it handles paths like 'a.b' or '[0].a')
          path = cleanedPath.replace(/^\./, '');
        }

        const graphInputValue = graphInputValues[graphInputId];

        if (graphInputValue) {
          let targetValue: any;
          if (path !== undefined) {
            // Use lodash/get to safely access the nested value
            targetValue = get(graphInputValue.value, path);
          } else {
            // No path, use the value directly from the DataValue
            targetValue = graphInputValue.value;
          }

          // Coerce the final target value to string
          if (targetValue === null || targetValue === undefined) {
            value = undefined;
          } else if (typeof targetValue === 'string') {
            value = targetValue;
          } else if (typeof targetValue === 'number' || typeof targetValue === 'boolean') {
            value = String(targetValue);
          } else {
            // For objects, arrays, etc., attempt to stringify
            try {
              value = JSON.stringify(targetValue);
            } catch (e) {
              value = undefined; // Could not stringify
            }
          }
        } else {
          value = undefined; // graphInputId not found
        }
      } else {
        value = values[token]; // Regular input variable
      }

      if (value === undefined) return '';

      if (processing.length > 0) {
        return applyProcessing(value, p1);
      }

      return value;
    })
    .replace(ESCAPED_TOKEN_REGEX, (_m, p1) => {
      // Restore escaped tokens like {{{token}}}
      return `{{${p1}}}`; // Note: This restores to {{token}}, maybe should be {{{token}}}? Needs check.
    });
}

// Extract all unique variable names from a template string
// Ignores variables starting with @input., as they are treated as special graph input references.
export function extractInterpolationVariables(template: string): string[] {
  const matches = template.matchAll(TOKEN_MATCH_REGEX);
  const variables = new Set<string>();

  for (const match of matches) {
    if (match[1]) {
      const [tokenPart] = match[1].split('|');
      if (tokenPart) {
        const token = tokenPart.trim();
        if (!token.startsWith('@input.')) {
          variables.add(token);
        }
      }
    }
  }

  return Array.from(variables);
}
