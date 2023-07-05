import { window } from '@tauri-apps/api';

export function isInTauri(): boolean {
  try {
    window.getCurrent();
    return true;
  } catch (err) {
    return false;
  }
}
