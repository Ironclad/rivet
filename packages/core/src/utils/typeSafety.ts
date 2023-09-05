/**
 * Type-safe version of {@link Object.entries} which can infer the type for the keys in the
 * returned pairs when the input object has a branded type as its key.
 *
 * @example
 * type MyId = string & { __myIdBrand: unknown };
 * // Types check out!
 * const things: [MyId, Thing][] = Objects.entries({} as Record<MyId, Thing>);
 *
 * @see {@link fromEntries}
 */
export const entries = <K extends string, V>(
  // In principle we should be able to use only Partial<> as the type is a superset of the non-
  // Partial type, but in practice this causes the compiler to infer a too-restricted type for V
  // in some cases involving unions.
  object: Record<K, V> | Partial<Record<K, V>> | undefined | null,
): [K, V][] => (object == null ? [] : (Object.entries(object) as [K, V][]));

/**
 * Type-safe version of {@link Object.fromEntries} which can infer the type for the key in the
 * returned object when the input array has a branded type as its key.
 *
 * @example
 * type MyId = string & { __myIdBrand: unknown };
 * // Types check out!
 * const things: Partial<Record<MyId, Thing>> = Objects.fromEntries([] as [MyId, Thing][]);
 *
 * @see {@link entries}
 */
// This returns a Partial<> because we can't guarantee that every key is present when K is a
// string literal union (which is what Record<K, V> would be saying). As a side effect, this means
// that using this with branded IDs will force null checks downstream, which is good practice.
export function fromEntries<K extends string, V>(entries_: Iterable<[K, V]>): Partial<Record<K, V>> {
  return Object.fromEntries(entries_) as Partial<Record<K, V>>;
}

/**
 * Type safe version of Object.keys()
 */
export function keys<K extends string>(o: Record<K, unknown>): K[];
export function keys<T>(o: T): (keyof T)[];
export function keys(o: object) {
  return Object.keys(o);
}

/**
 * Type safe version of Object.values()
 */
export function values<V extends string>(o: Record<keyof any, V>): V[];
export function values<T>(o: T): T[keyof T][];
export function values(o: object) {
  return Object.values(o);
}

export function mapValues<T extends object, U>(
  o: T,
  fn: (value: T[keyof T]) => U,
): {
  [K in keyof T]: U;
} {
  return Object.fromEntries(Object.entries(o).map(([key, value]) => [key, fn(value)])) as any;
}
