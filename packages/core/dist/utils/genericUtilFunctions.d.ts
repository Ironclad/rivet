export declare function isNotNull<T>(value: T | undefined | null): value is T;
/**
 * Checks that the given tuple is exhaustive, ie. it represents all possible values in the union T.
 * Note that this function returns a function, so the function needs to be called like
 * `SpecificStrings.exhaustiveTuple<Furniture>()('v1', 'v2', ...)`.
 * If you miss a value, the type error will tell you which value you missed.
 *
 * Taken from https://stackoverflow.com/a/55266531/
 *
 * @example
 *   type Furniture = 'chair' | 'table' | 'lamp' | 'ottoman';
 *   const furniture = SpecificStrings.exhaustiveTuple<Furniture>()('chair', 'table', 'lamp', 'ottoman');
 *
 *   // error, argument of type '"chair"' is not assignable to parameter of type '"You are missing ottoman"'.
 *   const missingFurniture = SpecificStrings.exhaustiveTuple<Furniture>()('chair', 'table', 'lamp');
 */
export declare const exhaustiveTuple: <T extends string>() => <L extends T[]>(...x: [T] extends [L[number]] ? L : `You are missing ${Exclude<T, L[number]>}`[]) => [T] extends [L[number]] ? L : `You are missing ${Exclude<T, L[number]>}`[];
/**
 * See exhaustiveTuple above. Does the same thing except returns a Set, not an array.
 */
export declare const exhaustiveSet: <T extends string>() => <L extends T[]>(...x: [T] extends [L[number]] ? L : `You are missing ${Exclude<T, L[number]>}`[]) => Set<([T] extends [L[number]] ? L : `You are missing ${Exclude<T, L[number]>}`[])[number]>;
