/** Let the user type things like \n and \t in the editor, and they'll be replaced with the actual characters. */
export function handleEscapeCharacters(inputString: string): string {
  // Would use negative lookbehind but not supported in some recent safari versions >.<
  return inputString
    .replace(/([^\\]|^)\\n/g, '$1\n')
    .replace(/([^\\]|^)\\t/g, '$1\t')
    .replace(/([^\\]|^)\\r/g, '$1\r')
    .replace(/([^\\]|^)\\f/g, '$1\f')
    .replace(/([^\\]|^)\\b/g, '$1\b')
    .replace(/([^\\]|^)\\v/g, '$1\v');
}
