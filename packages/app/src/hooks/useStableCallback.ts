import { useCallback } from 'react';

import { useUnrenderedValue } from './useUnrenderedValue.js';

/**
 * Very similar to useCallback, but is guaranteed to be referentially equal, even when deps change.
 * This means that the returned function must NOT be called during render, but for most callback
 * use case, eg. event handlers, this is a lot easier to use without worrying about the callback
 * causing re-renders on child components.
 *
 * This is not recommended if you just need to drill a complex setState function down through
 * a lot of components - in that case it is better to wrap a useReducer with a Context instead.
 *
 * @see https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
 * for the source of this and caveats
 *
 * @example
 * const fetchResults = () => {
 *   // Do network stuff
 * };
 *
 * // onClick will not change even though fetchResults is not wrapped in useCallback, nor will
 * // updates to workflow ID prop cause the function to change
 * const onClick = useStableCallback((userId) => {
 *   fetchResults(props.workflowId, userId);
 * });
 */
export function useStableCallback<Arguments extends any[], ReturnType>(
  callback: (...args: Arguments) => ReturnType,
): (...args: Arguments) => ReturnType {
  const stableCallback = useUnrenderedValue(callback);
  return useCallback((...args: Arguments) => stableCallback.value(...args), [stableCallback]);
}
