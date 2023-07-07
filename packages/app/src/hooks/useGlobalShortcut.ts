import { useEffect } from 'react';
import { register, unregister } from '@tauri-apps/api/globalShortcut';
import { useStableCallback } from './useStableCallback.js';

export function useGlobalShortcut(shortcut: string, handler: () => void) {
  // const handlerStable = useStableCallback(() => {
  //   handler();
  // });
  // useEffect(() => {
  //   register(shortcut, handlerStable);
  //   return () => {
  //     unregister(shortcut);
  //   };
  // }, [handlerStable, shortcut]);
}
