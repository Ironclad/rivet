export const TOKEN_MATCH_REGEX = /\{\{(?!\{)([^{}\s][^{}]*[^{}\s]|[^{}\s])\}\}(?!\})/g;

export const ESCAPED_TOKEN_REGEX = /\{{3}([^{}]+)\}{3}/g;

export function interpolate(baseString: string, values: Record<string, string>): string {
  return baseString
    .replace(TOKEN_MATCH_REGEX, (_m, p1) => {
      const value = values[p1];
      return value !== undefined ? value : '';
    })
    .replace(ESCAPED_TOKEN_REGEX, (_m, p1) => {
      return `{{${p1}}}`;
    });
}
