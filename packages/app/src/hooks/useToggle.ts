import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { RecoilState, useRecoilState } from 'recoil';

export type SetState<S> = Dispatch<SetStateAction<S>>;

export interface ToggleHookFunction {
  (): void;
  set: (state: boolean) => void;
  on: () => void;
  off: () => void;
}

export function useToggleFrom(stateAndSetState: readonly [boolean, SetState<boolean>]): [boolean, ToggleHookFunction] {
  const [toggle, setToggle] = stateAndSetState;

  const toggleFn = useMemo(() => {
    const fn = (() => {
      setToggle((v) => !v);
    }) as ToggleHookFunction;

    fn.set = (state: boolean) => {
      setToggle(state);
    };

    fn.on = () => {
      setToggle(true);
    };

    fn.off = () => {
      setToggle(false);
    };

    return fn;
  }, [setToggle]);

  return [toggle, toggleFn];
}

export function useToggle(initial: boolean = false) {
  return useToggleFrom(useState(initial));
}

export function useRecoilToggle(atom: RecoilState<boolean>) {
  const [state, setState] = useRecoilState(atom);

  return useToggleFrom([state, setState]);
}
