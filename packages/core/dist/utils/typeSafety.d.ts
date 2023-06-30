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
export declare const entries: <K extends string, V>(object: Record<K, V> | Partial<Record<K, V>> | null | undefined) => [K, V][];
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
export declare function fromEntries<K extends string, V>(entries_: Iterable<[K, V]>): Partial<Record<K, V>>;
/**
 * Type safe version of Object.keys()
 */
export declare function keys<K extends string>(o: Record<K, unknown>): K[];
export declare function keys<T>(o: T): (keyof T)[];
/**
 * Type safe version of Object.values()
 */
export declare function values<V extends string>(o: Record<keyof any, V>): V[];
export declare function values<T>(o: T): T[keyof T][];
