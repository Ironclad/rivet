import { open } from '@tauri-apps/api/shell';
import { isInTauri } from '../utils/tauri';
import { toast } from 'react-toastify';

export function useOpenUrl(url: string) {
  return async () => {
    if (isInTauri()) {
      open(url).catch((err) => {
        toast.error(`Failed to open URL: ${err}`);
      });
    } else {
      window.open(url, '_blank');
    }
  };
}
