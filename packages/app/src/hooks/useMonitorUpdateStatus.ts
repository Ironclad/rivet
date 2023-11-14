import { isInTauri } from '../utils/tauri';
import { onUpdaterEvent } from '@tauri-apps/api/updater';
import { useSetRecoilState } from 'recoil';
import { updateStatusState } from '../state/settings';
import { match } from 'ts-pattern';
import useAsyncEffect from 'use-async-effect';

export function useMonitorUpdateStatus() {
  const setUpdateStatus = useSetRecoilState(updateStatusState);

  useAsyncEffect(async () => {
    let unlisten: any | undefined = undefined;

    if (isInTauri()) {
      unlisten = await onUpdaterEvent(({ error, status }) => {
        match(status as typeof status | 'DOWNLOADED') // -.-
          .with('PENDING', async () => setUpdateStatus('Downloading...'))
          .with('DONE', async () => setUpdateStatus('Installed.'))
          .with('ERROR', async () => setUpdateStatus(`Error - ${error}`))
          .with('UPTODATE', async () => setUpdateStatus('Up to date.'))
          .with('DOWNLOADED', async () => setUpdateStatus('Installing...'))
          .exhaustive();
      });
    }

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, []);
}
