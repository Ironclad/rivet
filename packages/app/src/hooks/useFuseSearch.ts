import Fuse from 'fuse.js';
import { useEffect, useMemo, useRef } from 'react';

export interface UseFuseSearchOptions<T = unknown> {
  /** If false, then searching will not be performed and noInputEmptyList will determine what results are shown (all or none). */
  enabled?: boolean;

  /**
   * If true, then an empty search input will return an empty list (no matches). If false, then an empty input will
   * simply show all items in the list. False is useful when _narrowing_ a list of items using search. Default false.
   */
  noInputEmptyList?: boolean;

  /** The maximum number of search results to return. No limit if undefined. Defaults to undefined. */
  max?: number;

  /** Override any of the default fuse options. */
  fuseOptions?: Fuse.IFuseOptions<T>;
}

/**
 * Uses fuse to perform client-side fuzzy searching.
 * @param list The full list of items that can be searched.
 * @param search The search string or fuse expression to search the list of items with.
 * @param keys If T is an object, then this specifies the key(s) of the object that should be used for searching.
 * @param options Additional options for the hook, see UseFuseSearchOptions.
 * @returns A list of fuse search result objects, one per item.
 */
export function useFuseSearch<T = unknown>(
  list: readonly T[],
  search: string | Fuse.Expression,
  keys: keyof T | (keyof T)[], // TODO deep keys? Supported by fuse but typing them is awkward
  options?: UseFuseSearchOptions,
): Fuse.FuseResult<T>[] {
  const { fuseOptions = {}, noInputEmptyList = false, max } = options ?? {};
  list = list.length === 0 ? (none as readonly T[]) : list; // Let empty array be passed in without memoizing 🤷‍♂️

  const fuseRef = useRef<Fuse<T> | undefined>();
  const keyList = (Array.isArray(keys) ? keys : [keys]) as Fuse.FuseOptionKey<T>[];
  const searchInput = typeof search === 'string' ? search.trim() : search;

  // TODO is there ever a legit reason to search fuse with an empty string?
  const enabled = (options?.enabled ?? true) && !!searchInput;

  const instantiate = () => {
    fuseRef.current = new Fuse(list, {
      keys: keyList,
      includeScore: true,
      includeMatches: true,
      threshold: 0.2,
      shouldSort: true,
      findAllMatches: true,
      ignoreLocation: true,
      ...fuseOptions,
    });
  };

  if (!fuseRef.current) {
    instantiate();
  }

  const fuse = fuseRef.current!;

  // Create new instance if any option changes
  useEffect(() => {
    instantiate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyList.join(), ...Object.values(fuseOptions)]); // TODO will double-instantiate right now

  // If list changes, set the collection on the current instance
  useEffect(() => {
    fuseRef.current!.setCollection(list);
  }, [list]);

  const searchResults = useMemo(
    () =>
      enabled ? fuse.search(searchInput, max != null ? { limit: max } : undefined) : (none as Fuse.FuseResult<T>[]),
    [fuse, searchInput, enabled, max],
  );

  const noResults = useMemo(
    () =>
      noInputEmptyList
        ? (none as Fuse.FuseResult<T>[])
        : list.map<Fuse.FuseResult<T>>((item) => ({ item, refIndex: 0, matches: [], score: 0 })),
    [list, noInputEmptyList],
  );

  return enabled ? searchResults : noResults;
}

const none: unknown[] = [];
