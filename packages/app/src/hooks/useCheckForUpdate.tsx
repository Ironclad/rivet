import { useEffect } from 'react';
import { checkUpdate, installUpdate, onUpdaterEvent } from '@tauri-apps/api/updater';
import useAsyncEffect from 'use-async-effect';
import { toast } from 'react-toastify';
import { css } from '@emotion/react';
import { isInTauri } from '../utils/tauri';
import { useSetRecoilState } from 'recoil';
import { updateModalOpenState } from '../state/settings';

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

export function useCheckForUpdate() {
  const setUpdateModalOpen = useSetRecoilState(updateModalOpenState);

  return async () => {
    const { shouldUpdate, manifest } = await checkUpdate();

    if (shouldUpdate) {
      toast.success(
        ({ closeToast }) => (
          <div css={toastStyle}>
            <div className="info">Rivet version {manifest?.version} is now available!</div>
            <div className="actions">
              <button className="primary" onClick={() => setUpdateModalOpen(true)}>
                Install
              </button>
              <button onClick={() => installUpdate()}>Skip</button>
              <button onClick={() => closeToast?.()}>Not Now</button>
            </div>
          </div>
        ),
        {
          autoClose: false,
          closeButton: false,
        },
      );
    }
  };
}
