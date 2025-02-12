import { checkUpdate } from '@tauri-apps/api/updater';
import { toast } from 'react-toastify';
import { css } from '@emotion/react';
import { isInTauri } from '../utils/tauri';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { checkForUpdatesState, skippedMaxVersionState, updateModalOpenState } from '../state/settings';
import { lte } from 'semver';
import { swallowPromise } from '../utils/syncWrapper';

const toastStyle = css`
  display: flex;
  flex-direction: column;

  .actions {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
  }

  button {
    background-color: var(--grey);
    color: var(--grey-lightest);
    font-family: apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
      'Droid Sans', 'Helvetica Neue', sans-serif;
    border: 1px solid var(--grey-lightest);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
    font-size: 14px;
    cursor: pointer;

    &.primary {
      background-color: var(--primary);
      color: var(--foreground-on-primary);
    }
  }
`;

export function useCheckForUpdate({
  notifyNoUpdates = false,
  force = false,
}: { notifyNoUpdates?: boolean; force?: boolean } = {}) {
  const setUpdateModalOpen = useSetAtom(updateModalOpenState);
  const checkForUpdates = useAtomValue(checkForUpdatesState);
  const [skippedMaxVersion, setSkippedMaxVersion] = useAtom(skippedMaxVersionState);

  return async () => {
    if (!checkForUpdates || !isInTauri()) {
      console.log('Skipping update check');
      return;
    }

    const { shouldUpdate, manifest } = await checkUpdate();

    if (!manifest) {
      console.log('No manifest found');
      return;
    }

    const shouldSkip = skippedMaxVersion == null ? false : lte(manifest.version, skippedMaxVersion);

    if (force) {
      setSkippedMaxVersion(undefined);
    }

    if (shouldUpdate && (force || !shouldSkip)) {
      toast.success(
        ({ closeToast }) => (
          <div css={toastStyle}>
            <div className="info">Rivet version {manifest?.version} is now available!</div>
            <div className="actions">
              <button className="primary" onClick={() => setUpdateModalOpen(true)}>
                Install
              </button>
              <button onClick={() => setSkippedMaxVersion(manifest?.version)}>Skip</button>
              <button onClick={() => closeToast?.()}>Not Now</button>
            </div>
          </div>
        ),
        {
          autoClose: false,
          closeButton: false,
        },
      );
    } else if (notifyNoUpdates) {
      toast.info('Rivet is up to date!');
    }
  };
}
