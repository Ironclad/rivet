import { dedent } from './misc.js';
import type { DataValue } from '../model/DataValue.js';
import { get as lodashGet } from 'lodash-es';

// Simpler regex allowing spaces, relies on trim() later
export const TOKEN_MATCH_REGEX = /\{\{([^}]+?)\}\}/g;
export const ESCAPED_TOKEN_REGEX = /\{\{\{([^}]+?)\}\}\}/g;
export const ESCAPED_ESCAPED_TOKEN_REGEX = /\\\{\\\{([^}]+?)\\\}\\\}/g;

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

// Helper function to check and potentially unwrap a DataValue-like object
export function unwrapPotentialDataValue(value: any): any {
  if (
    typeof value === 'object' &&
    value !== null &&
    typeof value.type === 'string' &&
    Object.prototype.hasOwnProperty.call(value, 'value') // More robust check for 'value' property
  ) {
    return value.value;
  }
  return value;
}

// Renamed from resolveExpression, now exported and returns raw value
export function resolveExpressionRawValue(
  source: Record<string, any> | undefined,
  expression: string,
  sourceType: 'graphInputs' | 'context',
): any | undefined {
  if (!source) {
    return undefined;
  }

  // Regex to capture the main key and the optional path starting with . or [
  // Allows for spaces around the key, path, ., and []
  // Key: Group 1; Path: Group 2
  const match = expression.trim().match(/^([^[.\s]+)\s*(.*)$/);

  let key: string | undefined;
  let path: string | undefined;

  // Check if match is successful AND group 1 (the key) was captured
  if (match && typeof match[1] === 'string') {
    key = match[1];
    const rawPath = match[2]; // Group 2 (the path part, might start with . or [)

    // Clean and assign path only if rawPath is not empty
    if (rawPath) {
      // Clean path: Trim whitespace, then remove spaces around separators '.', '[', ']'
      // Preserve the leading '.' or '[' as lodashGet handles them.
      path = rawPath.trim().replace(/\s*(\.|\[|\])\s*/g, '$1');
    } else {
      path = undefined;
    }
  } else {
    // If match failed or group 1 wasn't captured (fallback)
    // Assume the entire expression is the key and there's no path
    key = expression.trim();
    path = undefined;
  }

  if (!key) {
    // If key is empty after trimming, it's invalid.
    return undefined;
  }

  const topLevelValue = source[key];

  if (topLevelValue === undefined) {
    return undefined; // Key not found in source
  }

  // Get the base value by potentially unwrapping the top-level value using the shared helper
  const baseValue = unwrapPotentialDataValue(topLevelValue);

  // If there's a path, try to resolve it using lodashGet on the baseValue
  let finalValue: any;
  if (path) {
    try {
      finalValue = lodashGet(baseValue, path);

      // IMPORTANT: After getting a potentially nested value via path,
      // we might *still* have a DataValue (if the context stores them nested).
      // Unwrap again to be safe.
      finalValue = unwrapPotentialDataValue(finalValue);
    } catch (error) {
      console.warn(`Error accessing path "${path}" in ${sourceType} value for key "${key}":`, error);
      return undefined; // Error during path access
    }
  } else {
    finalValue = baseValue; // No path, use the (potentially unwrapped) base value
  }

  // Return the raw final value
  return finalValue;
}

// New function: Resolves and converts to string format suitable for TextNode
export function resolveExpressionToString(
  source: Record<string, any> | undefined,
  expression: string,
  sourceType: 'graphInputs' | 'context',
): string | undefined {
  const finalValue = resolveExpressionRawValue(source, expression, sourceType);

  if (finalValue === undefined) {
    return undefined;
  }

  // Convert the final value to a string for TextNode context
  if (typeof finalValue === 'object' && finalValue !== null) {
    try {
      return JSON.stringify(finalValue);
    } catch (error) {
      console.warn(`Error stringifying object/array in ${sourceType} for expression "${expression}":`, error);
      return '[object Object]'; // Fallback
    }
  }

  // For primitives
  return String(finalValue);
}

// Helper function to parse processing instructions like "indent 2" or "quote" into function name and parameter
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
  template: string,
  variables: Record<string, DataValue | string | undefined>,
  graphInputValues?: Record<string, DataValue>,
  contextValues?: Record<string, DataValue>,
): string {
  return template
    .replace(ESCAPED_TOKEN_REGEX, (_match, expression) => {
      // Replace with \{\{expression\}\} to escape
      return `\\{\\{${expression}\\}\\}`; // Escaped token
    })
    .replace(/\{\{((?:@graphInputs|@context)\..*?|[^}]+?)\}\}/g, (_match, expressionWithMaybeProcessing) => {
      const parts = expressionWithMaybeProcessing.split('|').map((s: string) => s.trim());
      const expression = parts[0]!; // The variable name or path, e.g., @context.foo.bar or myVar
      const processingChain = parts.slice(1).join('|'); // e.g., indent 2 | quote

      let resolvedValue: string | undefined;

      if (expression.startsWith('@graphInputs.')) {
        // Use the new string-converting function
        resolvedValue = resolveExpressionToString(
          graphInputValues,
          expression.substring('@graphInputs.'.length),
          'graphInputs',
        );
      } else if (expression.startsWith('@context.')) {
        // Use the new string-converting function
        resolvedValue = resolveExpressionToString(contextValues, expression.substring('@context.'.length), 'context');
      } else {
        const simpleVar = variables[expression];
        if (simpleVar !== undefined) {
          // Simple variables might be DataValue or raw strings
          resolvedValue = String(unwrapPotentialDataValue(simpleVar) ?? '');
        } else {
          resolvedValue = undefined; // Variable not found
        }
      }

      if (resolvedValue === undefined) {
        // Return an empty string if the variable is not found or resolves to undefined
        console.warn(`Interpolation variable or path "${expression}" not found or resolved to undefined.`);
        return '';
      }

      // Apply processing if any instructions exist
      if (processingChain) {
        return applyProcessing(resolvedValue, processingChain);
      }

      return resolvedValue;
    })
    .replace(ESCAPED_ESCAPED_TOKEN_REGEX, (_match, expression) => {
      // Replace with {{expression}} to unescape
      return `{{${expression}}}`; // Unescaped token
    });
}

// Extract all unique variable names from a template string
// Ignores variables starting with @graphInputs. or @context., as they are treated as special references.
export function extractInterpolationVariables(template: string): string[] {
  const matches = template
    .replace(ESCAPED_TOKEN_REGEX, (_match, content) => {
      // Replace escaped tokens with the escaped escaped version so they're not matched
      return `\\{\\{${content}\\}\\}`;
    })
    .matchAll(TOKEN_MATCH_REGEX);
  const variables = new Set<string>();

  for (const match of matches) {
    if (match[1]) {
      const [tokenPart] = match[1].split('|');
      if (tokenPart) {
        const token = tokenPart.trim();

        // Filter out special prefixes
        if (!token.startsWith('@graphInputs.') && !token.startsWith('@context.')) {
          variables.add(token);
        }
      }
    }
  }

  return Array.from(variables);
}
