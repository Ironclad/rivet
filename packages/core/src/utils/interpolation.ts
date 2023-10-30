export function interpolate(baseString: string, values: Record<string, string>): string {
  return baseString.replace(/\{\{([^}]+)\}\}/g, (_m, p1) => {
    const value = values[p1];
    return value !== undefined ? value : '';
  });
}
