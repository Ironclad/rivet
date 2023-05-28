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
export const entries = (
// In principle we should be able to use only Partial<> as the type is a superset of the non-
// Partial type, but in practice this causes the compiler to infer a too-restricted type for V
// in some cases involving unions.
object) => (object == null ? [] : Object.entries(object));
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
export function fromEntries(entries_) {
    return Object.fromEntries(entries_);
}
export function keys(o) {
    return Object.keys(o);
}
export function values(o) {
    return Object.values(o);
}
