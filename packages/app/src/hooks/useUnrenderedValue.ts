import { useLayoutEffect, useRef } from 'react';

/**
 * A very simple interface, but a good marker of intent
 */
export interface UnrenderedValue<T> {
  value: T;
}

/**
 * useUnrenderedValue is meant to wrap a value in a container that will _always_ be reference equal.
 * This can be very useful for constructing callbacks or imperative functions that use these values but explicitly
 * do _not_ use these values to render content. This is important because new references are required for React
 * to render at the correct times.
 *
 * For example, in this case `payload` is never rendered, but used as a callback.
 * We don't want to rerender `ExpensiveComponent` whenever this payload changes,
 * but we do want it to use the current value when its callback is called.
 * ```tsx
 * const PerformantComponent = ({ payload }: Props) => {
 *   const unrenderedPayload = useUnrenderedValue(payload);
 *   const do = React.useCallback(() => unrenderedPayload.value.do(), [unrenderedPayload]);
 *   return (
 *     <ExpensiveComponent do={do}>
 *   )
 * };
 * ```
 *
 * @see https://reactjs.org/docs/optimizing-performance.html#avoid-reconciliation which includes information
 * about optimizing for React performance but focuses more specifically on class components
 */
export function useUnrenderedValue<T>(value: T): UnrenderedValue<T> {
  const unrenderedValueRef = useRef({ value });

  // Updating ref is also a side effect. Not wrapping would still work right now, but
  // for concurrent mode compatibility we wrap this with useLayoutEffect. We use
  // layout effect just in case the value also need to be used in a layout effect.
  useLayoutEffect(() => {
    unrenderedValueRef.current.value = value;
  });

  return unrenderedValueRef.current;
}
