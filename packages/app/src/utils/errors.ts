/** Gets an Error from an unknown error object (strict unknown errors is enabled, helper util). */
export function getError(error: unknown): Error {
  const errorInstance =
    typeof error === 'object' && error instanceof Error
      ? error
      : new Error(error != null ? error.toString() : 'Unknown error');
  return errorInstance;
}
