import { useLatest } from 'ahooks';
import { useEffect } from 'react';

interface UseGlobalHotkeyOptions {
  notWhenInputFocused?: boolean;
}

export const useGlobalHotkey = (
  key: string,
  action: (event: KeyboardEvent) => void,
  options: UseGlobalHotkeyOptions = { notWhenInputFocused: false },
) => {
  const latestAction = useLatest(action);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement;
      const isInputOrTextarea =
        activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

      if (e.code === key && (!options.notWhenInputFocused || !isInputOrTextarea)) {
        latestAction.current(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [key, latestAction, options]);
};
